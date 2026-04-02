import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "",
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { ticker, stock, criteria, score } = req.body;

  if (!ticker || !stock) {
    res.status(400).json({ error: "ticker and stock are required" });
    return;
  }

  try {
    const METRIC_NAMES: Record<string, string> = {
      pe_ratio: "P/E Ratio",
      debt_to_equity: "Debt-to-Equity",
      eps_growth: "EPS Growth (%)",
      dividend_yield: "Dividend Yield (%)",
      roe: "ROE (%)",
      revenue_growth: "Revenue Growth (%)",
      profit_margin: "Profit Margin (%)",
      current_ratio: "Current Ratio",
      market_cap_b: "Market Cap ($B)",
      beta: "Beta",
    };

    let criteriaBreakdown = "No specific criteria were applied.";
    if (criteria && criteria.length > 0) {
      criteriaBreakdown = criteria.map((c: { metric: string; operator: string; value: number; value2?: number }) => {
        const opLabel = c.operator === "between" ? "between" : c.operator;
        const threshold = c.operator === "between" ? `${c.value}–${c.value2}` : c.value;
        const metricName = METRIC_NAMES[c.metric] || c.metric;
        return `${metricName}: threshold ${opLabel} ${threshold}`;
      }).join("\n");
    }

    const prompt = `You are a financial analysis assistant for Investor Buddy. Analyze ${stock.name} (${ticker}) in the ${stock.sector} sector.

Score: ${score}/100
${criteria && criteria.length > 0 ? `Criteria applied:\n${criteriaBreakdown}` : "No screening criteria were applied. Provide a general overview of the stock's financial health."}

Key financial data:
- Price: $${stock.price}
- P/E Ratio: ${stock.peRatio}
- Debt-to-Equity: ${stock.debtToEquity}
- EPS Growth: ${stock.epsGrowth}%
- Dividend Yield: ${stock.dividendYield}%
- ROE: ${stock.roe}%
- Revenue Growth: ${stock.revenueGrowth}%
- Profit Margin: ${stock.profitMargin}%
- Current Ratio: ${stock.currentRatio}
- Market Cap: $${stock.marketCapB}B
- Beta: ${stock.beta}

Rules:
- Write 3-4 concise paragraphs in plain language
- ${criteria && criteria.length > 0 ? "Explain which criteria the stock passes or fails and what that means for the investor's strategy" : "Assess the stock's strengths and weaknesses based on its financial metrics"}
- Be factual and objective — no predictions or investment advice
- End with what the investor should consider further

Keep language accessible to a retail investor.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    res.json({ explanation: text });
  } catch (err) {
    req.log.error({ err }, "AI analysis error");
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
});

export default router;
