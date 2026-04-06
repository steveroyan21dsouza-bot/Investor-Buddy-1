import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || "",
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const METRIC_NAMES: Record<string, string> = {
  pe_ratio: "P/E Ratio",
  debt_to_equity: "Debt-to-Equity",
  eps_growth: "EPS Growth (%)",
  dividend_yield: "Dividend Yield (%)",
  roe: "Return on Equity (%)",
  revenue_growth: "Revenue Growth (%)",
  profit_margin: "Profit Margin (%)",
  current_ratio: "Current Ratio",
  market_cap_b: "Market Cap ($B)",
  beta: "Beta",
};

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { ticker, stock, criteria, score } = req.body;

  if (!ticker || !stock) {
    res.status(400).json({ error: "ticker and stock are required" });
    return;
  }

  try {
    let criteriaSection = "";
    if (criteria && criteria.length > 0) {
      criteriaSection = criteria
        .map((c: { metric: string; operator: string; value: number; value2?: number }) => {
          const name = METRIC_NAMES[c.metric] || c.metric;
          const threshold =
            c.operator === "between"
              ? `between ${c.value} and ${c.value2}`
              : `${c.operator} ${c.value}`;
          return `  • ${name}: must be ${threshold}`;
        })
        .join("\n");
    }

    const prompt = `You are a financial analysis assistant for Investor Buddy, a stock screening tool used in ENTI 674 at Haskayne School of Business.

Analyze ${stock.name} (${ticker}) — ${stock.sector} sector. Screening score: ${score}/100.

FINANCIAL DATA:
- Price: $${stock.price}
- P/E Ratio: ${stock.peRatio}x
- Debt-to-Equity: ${stock.debtToEquity}
- EPS Growth: ${stock.epsGrowth}%
- Dividend Yield: ${stock.dividendYield}%
- Return on Equity: ${stock.roe}%
- Revenue Growth: ${stock.revenueGrowth}%
- Profit Margin: ${stock.profitMargin}%
- Current Ratio: ${stock.currentRatio}
- Market Cap: $${stock.marketCapB}B
- Beta: ${stock.beta}

${criteria && criteria.length > 0 ? `SCREENING CRITERIA APPLIED:\n${criteriaSection}` : "No screening criteria were applied."}

Respond using EXACTLY this format with these four section headers:

## Investment Thesis
One sentence capturing what type of investor this stock is designed for based on the criteria applied.

## Criteria Results
For each criterion above, one bullet line: state whether the stock passes or fails and briefly explain what the actual value means in plain language.

## Strengths & Risks
Two or three bullet strengths, then two or three bullet risks. Label them with "+" for strengths and "−" for risks.

## Bottom Line
One to two sentences: a plain-language verdict on whether this stock is a fit for the strategy, and one thing the investor should investigate further before deciding.

Rules: be factual, no predictions, no investment advice, accessible language for a business student.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    res.json({ explanation: text });
  } catch (err) {
    req.log.error({ err }, "AI analysis error");
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
});

export default router;
