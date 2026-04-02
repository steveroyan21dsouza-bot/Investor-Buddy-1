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
    const criteriaDescription = criteria && criteria.length > 0
      ? criteria.map((c: { metric: string; operator: string; value: number; value2?: number }) =>
          `${c.metric} ${c.operator} ${c.value}${c.value2 !== undefined ? ` and ${c.value2}` : ""}`
        ).join(", ")
      : "no specific criteria";

    const prompt = `You are a financial analyst assistant. Analyze ${ticker} (${stock.name}) based on the following data:

Financial Metrics:
- Price: $${stock.price}
- P/E Ratio: ${stock.peRatio}
- Debt-to-Equity: ${stock.debtToEquity}
- EPS Growth: ${stock.epsGrowth}%
- Dividend Yield: ${stock.dividendYield}%
- Return on Equity (ROE): ${stock.roe}%
- Revenue Growth: ${stock.revenueGrowth}%
- Profit Margin: ${stock.profitMargin}%
- Current Ratio: ${stock.currentRatio}
- Market Cap: $${stock.marketCapB}B
- Beta: ${stock.beta}
- Sector: ${stock.sector}

Investor's Screening Criteria: ${criteriaDescription}
Score against criteria: ${score}/100

Provide a concise 3-4 paragraph plain-language analysis explaining:
1. How well this stock matches the investor's criteria and why it scored ${score}/100
2. The key strengths of this stock based on the metrics
3. The main risks or concerns based on the metrics
4. A brief overall assessment

Keep the language accessible to a retail investor. Do not give specific buy/sell recommendations.`;

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
