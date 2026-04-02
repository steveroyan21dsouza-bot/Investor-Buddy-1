import { db, stocksTable } from "@workspace/db";

const stocks = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", price: 227.48, peRatio: 37.5, debtToEquity: 1.87, epsGrowth: 10.2, dividendYield: 0.44, roe: 157.4, revenueGrowth: 5.0, profitMargin: 26.3, currentRatio: 0.87, marketCapB: 3440, beta: 1.24 },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", price: 415.20, peRatio: 35.8, debtToEquity: 0.29, epsGrowth: 21.5, dividendYield: 0.72, roe: 35.6, revenueGrowth: 16.0, profitMargin: 35.6, currentRatio: 1.27, marketCapB: 3090, beta: 0.90 },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", price: 174.50, peRatio: 23.1, debtToEquity: 0.05, epsGrowth: 36.8, dividendYield: 0.46, roe: 32.0, revenueGrowth: 14.0, profitMargin: 29.5, currentRatio: 2.10, marketCapB: 2140, beta: 1.06 },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", price: 198.30, peRatio: 42.5, debtToEquity: 0.54, epsGrowth: 95.0, dividendYield: 0.0, roe: 23.8, revenueGrowth: 12.5, profitMargin: 8.0, currentRatio: 1.06, marketCapB: 2070, beta: 1.15 },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", price: 134.50, peRatio: 64.2, debtToEquity: 0.17, epsGrowth: 168.0, dividendYield: 0.03, roe: 115.8, revenueGrowth: 122.0, profitMargin: 55.8, currentRatio: 4.17, marketCapB: 3290, beta: 1.67 },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", price: 563.80, peRatio: 26.5, debtToEquity: 0.06, epsGrowth: 73.0, dividendYield: 0.35, roe: 36.6, revenueGrowth: 22.0, profitMargin: 38.0, currentRatio: 2.69, marketCapB: 1430, beta: 1.22 },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer", price: 248.50, peRatio: 78.3, debtToEquity: 0.07, epsGrowth: -71.0, dividendYield: 0.0, roe: 10.0, revenueGrowth: 1.0, profitMargin: 5.5, currentRatio: 1.84, marketCapB: 793, beta: 2.31 },
  { ticker: "BRK.B", name: "Berkshire Hathaway Inc.", sector: "Financial", price: 457.20, peRatio: 10.2, debtToEquity: 0.27, epsGrowth: 21.0, dividendYield: 0.0, roe: 14.3, revenueGrowth: 5.0, profitMargin: 15.2, currentRatio: 1.82, marketCapB: 996, beta: 0.88 },
  { ticker: "LLY", name: "Eli Lilly and Co.", sector: "Healthcare", price: 785.40, peRatio: 81.5, debtToEquity: 1.85, epsGrowth: 148.0, dividendYield: 0.69, roe: 63.8, revenueGrowth: 36.0, profitMargin: 21.7, currentRatio: 1.16, marketCapB: 748, beta: 0.51 },
  { ticker: "V", name: "Visa Inc.", sector: "Financial", price: 295.40, peRatio: 33.8, debtToEquity: 0.62, epsGrowth: 17.0, dividendYield: 0.73, roe: 52.5, revenueGrowth: 10.0, profitMargin: 54.5, currentRatio: 1.44, marketCapB: 629, beta: 0.93 },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial", price: 215.30, peRatio: 11.5, debtToEquity: 1.24, epsGrowth: 17.0, dividendYield: 2.22, roe: 17.5, revenueGrowth: 18.0, profitMargin: 31.5, currentRatio: 0.92, marketCapB: 623, beta: 1.08 },
  { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer", price: 91.30, peRatio: 37.0, debtToEquity: 0.68, epsGrowth: 140.0, dividendYield: 1.01, roe: 22.2, revenueGrowth: 5.0, profitMargin: 2.4, currentRatio: 0.83, marketCapB: 735, beta: 0.56 },
  { ticker: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare", price: 487.80, peRatio: 22.1, debtToEquity: 0.73, epsGrowth: -3.0, dividendYield: 1.43, roe: 25.5, revenueGrowth: 8.0, profitMargin: 5.9, currentRatio: 0.77, marketCapB: 447, beta: 0.57 },
  { ticker: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", price: 113.40, peRatio: 14.6, debtToEquity: 0.19, epsGrowth: -13.0, dividendYield: 3.37, roe: 14.0, revenueGrowth: 1.4, profitMargin: 8.9, currentRatio: 1.44, marketCapB: 454, beta: 0.93 },
  { ticker: "PG", name: "Procter & Gamble Co.", sector: "Consumer", price: 161.20, peRatio: 28.3, debtToEquity: 0.67, epsGrowth: 12.0, dividendYield: 2.34, roe: 32.4, revenueGrowth: 3.0, profitMargin: 18.6, currentRatio: 0.73, marketCapB: 381, beta: 0.55 },
  { ticker: "MA", name: "Mastercard Inc.", sector: "Financial", price: 501.80, peRatio: 38.5, debtToEquity: 2.08, epsGrowth: 21.0, dividendYield: 0.54, roe: 212.6, revenueGrowth: 11.0, profitMargin: 45.9, currentRatio: 1.16, marketCapB: 465, beta: 1.10 },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", price: 159.80, peRatio: 15.8, debtToEquity: 0.48, epsGrowth: 10.0, dividendYield: 3.21, roe: 24.2, revenueGrowth: 6.0, profitMargin: 11.0, currentRatio: 1.07, marketCapB: 384, beta: 0.56 },
  { ticker: "AVGO", name: "Broadcom Inc.", sector: "Technology", price: 167.50, peRatio: 32.8, debtToEquity: 1.52, epsGrowth: 47.0, dividendYield: 1.37, roe: 43.1, revenueGrowth: 51.0, profitMargin: 37.1, currentRatio: 1.03, marketCapB: 787, beta: 1.08 },
  { ticker: "HD", name: "The Home Depot Inc.", sector: "Consumer", price: 389.50, peRatio: 25.8, debtToEquity: 999.0, epsGrowth: -3.0, dividendYield: 2.39, roe: 999.0, revenueGrowth: -3.0, profitMargin: 10.2, currentRatio: 1.35, marketCapB: 386, beta: 1.04 },
  { ticker: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", price: 174.30, peRatio: 16.2, debtToEquity: 6.20, epsGrowth: 2.0, dividendYield: 3.45, roe: 999.0, revenueGrowth: 3.7, profitMargin: 18.3, currentRatio: 0.55, marketCapB: 308, beta: 0.65 },
  { ticker: "KO", name: "The Coca-Cola Co.", sector: "Consumer", price: 64.80, peRatio: 24.5, debtToEquity: 1.82, epsGrowth: 6.0, dividendYield: 3.08, roe: 40.7, revenueGrowth: 3.0, profitMargin: 22.8, currentRatio: 1.05, marketCapB: 279, beta: 0.59 },
  { ticker: "CVX", name: "Chevron Corp.", sector: "Energy", price: 143.70, peRatio: 13.9, debtToEquity: 0.17, epsGrowth: -18.0, dividendYield: 4.37, roe: 10.8, revenueGrowth: -8.0, profitMargin: 8.5, currentRatio: 1.37, marketCapB: 265, beta: 1.03 },
  { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer", price: 165.40, peRatio: 22.3, debtToEquity: 2.60, epsGrowth: -0.5, dividendYield: 3.32, roe: 53.4, revenueGrowth: 0.6, profitMargin: 10.9, currentRatio: 0.79, marketCapB: 228, beta: 0.61 },
  { ticker: "ADBE", name: "Adobe Inc.", sector: "Technology", price: 460.20, peRatio: 29.1, debtToEquity: 0.43, epsGrowth: 15.0, dividendYield: 0.0, roe: 33.5, revenueGrowth: 10.0, profitMargin: 26.0, currentRatio: 1.07, marketCapB: 203, beta: 1.39 },
  { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", price: 294.80, peRatio: 33.4, debtToEquity: 0.15, epsGrowth: 43.0, dividendYield: 0.0, roe: 10.1, revenueGrowth: 9.0, profitMargin: 15.8, currentRatio: 1.06, marketCapB: 284, beta: 1.30 },
  { ticker: "MCD", name: "McDonald's Corp.", sector: "Consumer", price: 294.70, peRatio: 24.5, debtToEquity: 999.0, epsGrowth: 2.0, dividendYield: 2.33, roe: 999.0, revenueGrowth: 1.5, profitMargin: 33.2, currentRatio: 1.28, marketCapB: 217, beta: 0.76 },
  { ticker: "ORCL", name: "Oracle Corp.", sector: "Technology", price: 163.40, peRatio: 31.2, debtToEquity: 999.0, epsGrowth: 18.0, dividendYield: 0.98, roe: 999.0, revenueGrowth: 6.0, profitMargin: 24.7, currentRatio: 0.87, marketCapB: 451, beta: 0.95 },
  { ticker: "ACN", name: "Accenture plc", sector: "Technology", price: 332.10, peRatio: 29.3, debtToEquity: 0.08, epsGrowth: 5.0, dividendYield: 1.72, roe: 32.1, revenueGrowth: 1.0, profitMargin: 10.9, currentRatio: 1.38, marketCapB: 210, beta: 1.10 },
  { ticker: "COST", name: "Costco Wholesale Corp.", sector: "Consumer", price: 907.40, peRatio: 52.5, debtToEquity: 0.36, epsGrowth: 17.0, dividendYield: 0.57, roe: 33.5, revenueGrowth: 8.0, profitMargin: 2.9, currentRatio: 0.96, marketCapB: 402, beta: 0.75 },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Technology", price: 701.00, peRatio: 49.5, debtToEquity: 0.82, epsGrowth: 102.0, dividendYield: 0.0, roe: 38.8, revenueGrowth: 15.0, profitMargin: 22.5, currentRatio: 1.25, marketCapB: 303, beta: 1.43 },
  { ticker: "BAC", name: "Bank of America Corp.", sector: "Financial", price: 40.50, peRatio: 13.8, debtToEquity: 1.14, epsGrowth: 8.0, dividendYield: 2.27, roe: 9.5, revenueGrowth: 5.0, profitMargin: 23.2, currentRatio: 0.73, marketCapB: 322, beta: 1.35 },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "Technology", price: 157.40, peRatio: 115.0, debtToEquity: 0.05, epsGrowth: -58.0, dividendYield: 0.0, roe: 2.5, revenueGrowth: 16.0, profitMargin: 5.9, currentRatio: 2.58, marketCapB: 256, beta: 1.72 },
  { ticker: "TMO", name: "Thermo Fisher Scientific", sector: "Healthcare", price: 489.10, peRatio: 27.8, debtToEquity: 0.70, epsGrowth: -14.0, dividendYield: 0.33, roe: 14.0, revenueGrowth: -4.0, profitMargin: 12.2, currentRatio: 2.02, marketCapB: 188, beta: 0.78 },
  { ticker: "GE", name: "GE Aerospace", sector: "Industrial", price: 166.70, peRatio: 31.5, debtToEquity: 0.86, epsGrowth: 143.0, dividendYield: 0.71, roe: 27.9, revenueGrowth: 6.0, profitMargin: 16.4, currentRatio: 1.38, marketCapB: 181, beta: 1.07 },
  { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrial", price: 364.50, peRatio: 17.5, debtToEquity: 1.75, epsGrowth: -8.0, dividendYield: 1.63, roe: 58.4, revenueGrowth: -3.0, profitMargin: 17.8, currentRatio: 1.24, marketCapB: 179, beta: 1.03 },
  { ticker: "INTU", name: "Intuit Inc.", sector: "Technology", price: 617.50, peRatio: 52.0, debtToEquity: 0.64, epsGrowth: 14.0, dividendYield: 0.60, roe: 18.1, revenueGrowth: 15.0, profitMargin: 18.5, currentRatio: 1.18, marketCapB: 173, beta: 1.26 },
  { ticker: "AMGN", name: "Amgen Inc.", sector: "Healthcare", price: 317.20, peRatio: 15.7, debtToEquity: 8.10, epsGrowth: 26.0, dividendYield: 3.40, roe: 76.4, revenueGrowth: 19.0, profitMargin: 29.3, currentRatio: 1.30, marketCapB: 170, beta: 0.41 },
  { ticker: "GS", name: "Goldman Sachs Group", sector: "Financial", price: 519.30, peRatio: 14.3, debtToEquity: 5.42, epsGrowth: 92.0, dividendYield: 2.33, roe: 12.7, revenueGrowth: 13.0, profitMargin: 23.5, currentRatio: 1.02, marketCapB: 177, beta: 1.32 },
  { ticker: "SPGI", name: "S&P Global Inc.", sector: "Financial", price: 491.70, peRatio: 48.0, debtToEquity: 0.80, epsGrowth: 25.0, dividendYield: 0.78, roe: 24.5, revenueGrowth: 12.0, profitMargin: 26.8, currentRatio: 1.32, marketCapB: 158, beta: 0.94 },
  { ticker: "RTX", name: "RTX Corp.", sector: "Industrial", price: 120.10, peRatio: 35.2, debtToEquity: 0.85, epsGrowth: 20.0, dividendYield: 2.03, roe: 9.9, revenueGrowth: 13.0, profitMargin: 5.1, currentRatio: 1.10, marketCapB: 158, beta: 0.66 },
  { ticker: "LOW", name: "Lowe's Companies Inc.", sector: "Consumer", price: 233.80, peRatio: 21.0, debtToEquity: 999.0, epsGrowth: 7.0, dividendYield: 1.90, roe: 999.0, revenueGrowth: -4.0, profitMargin: 10.2, currentRatio: 1.16, marketCapB: 136, beta: 1.09 },
  { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare", price: 29.30, peRatio: 99.0, debtToEquity: 0.64, epsGrowth: -66.0, dividendYield: 6.64, roe: 1.7, revenueGrowth: -41.0, profitMargin: 1.6, currentRatio: 1.28, marketCapB: 166, beta: 0.44 },
  { ticker: "NEE", name: "NextEra Energy Inc.", sector: "Utilities", price: 72.80, peRatio: 22.8, debtToEquity: 1.29, epsGrowth: 39.0, dividendYield: 2.81, roe: 13.5, revenueGrowth: -5.0, profitMargin: 23.4, currentRatio: 0.42, marketCapB: 148, beta: 0.51 },
  { ticker: "INTC", name: "Intel Corp.", sector: "Technology", price: 22.30, peRatio: 99.0, debtToEquity: 0.52, epsGrowth: -100.0, dividendYield: 0.0, roe: -12.3, revenueGrowth: -9.0, profitMargin: -14.9, currentRatio: 1.39, marketCapB: 94, beta: 0.72 },
  { ticker: "AXP", name: "American Express Co.", sector: "Financial", price: 281.00, peRatio: 19.4, debtToEquity: 1.73, epsGrowth: 23.0, dividendYield: 1.12, roe: 34.1, revenueGrowth: 9.0, profitMargin: 16.1, currentRatio: 1.41, marketCapB: 201, beta: 1.11 },
  { ticker: "HON", name: "Honeywell International", sector: "Industrial", price: 216.40, peRatio: 22.5, debtToEquity: 0.90, epsGrowth: 8.0, dividendYield: 2.20, roe: 33.5, revenueGrowth: 4.0, profitMargin: 15.7, currentRatio: 1.14, marketCapB: 136, beta: 0.84 },
  { ticker: "IBM", name: "IBM Corp.", sector: "Technology", price: 215.50, peRatio: 28.3, debtToEquity: 3.20, epsGrowth: -17.0, dividendYield: 3.10, roe: 26.4, revenueGrowth: 3.0, profitMargin: 12.2, currentRatio: 0.95, marketCapB: 199, beta: 0.62 },
  { ticker: "T", name: "AT&T Inc.", sector: "Telecom", price: 22.30, peRatio: 12.5, debtToEquity: 1.17, epsGrowth: -19.0, dividendYield: 5.73, roe: 12.1, revenueGrowth: 0.7, profitMargin: 10.4, currentRatio: 0.65, marketCapB: 160, beta: 0.66 },
  { ticker: "VZ", name: "Verizon Communications", sector: "Telecom", price: 40.70, peRatio: 10.3, debtToEquity: 1.66, epsGrowth: -5.0, dividendYield: 6.41, roe: 21.3, revenueGrowth: 0.9, profitMargin: 15.6, currentRatio: 0.71, marketCapB: 172, beta: 0.38 },
];

async function seedStocks() {
  const existing = await db.select().from(stocksTable).limit(1);
  if (existing.length > 0) {
    console.log("Stocks already seeded, skipping...");
    return;
  }

  console.log(`Seeding ${stocks.length} stocks...`);
  await db.insert(stocksTable).values(stocks);
  console.log("Stocks seeded successfully!");
}

seedStocks().then(() => process.exit(0)).catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
