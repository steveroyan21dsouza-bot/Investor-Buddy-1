import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetCriteriaSets, useScreenStocks, useAnalyzeStock, useAddToWatchlist, getGetWatchlistQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, Cpu, Eye, CheckCircle2, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const METRIC_LABELS: Record<string, string> = {
  pe_ratio: "P/E Ratio",
  debt_to_equity: "Debt/Equity",
  eps_growth: "EPS Growth",
  dividend_yield: "Div. Yield",
  roe: "ROE",
  revenue_growth: "Rev. Growth",
  profit_margin: "Profit Margin",
  current_ratio: "Current Ratio",
  market_cap_b: "Market Cap",
  beta: "Beta",
};

const OP_LABELS: Record<string, string> = {
  "<": "<",
  "<=": "≤",
  ">": ">",
  ">=": "≥",
  "between": "between",
};

const SECTOR_COLORS: Record<string, string> = {
  Technology: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Healthcare: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Financial: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Consumer: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Industrial: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
  Energy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Utilities: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
};

type SortKey = "score" | "price" | "peRatio" | "epsGrowth" | "marketCapB";

function SortButton({ label, sortKey, current, dir, onSort }: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
    >
      {label}
      {active ? (dir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : <ArrowUpDown size={12} />}
    </button>
  );
}

function AnalysisContent({ text }: { text: string }) {
  const sections = text.split(/^## /m).filter(Boolean);

  if (sections.length <= 1) {
    return (
      <div className="space-y-2">
        {text.split("\n").filter(Boolean).map((line, i) => (
          <p key={i} className="text-sm leading-relaxed">{line}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const newline = section.indexOf("\n");
        const heading = newline === -1 ? section.trim() : section.slice(0, newline).trim();
        const body = newline === -1 ? "" : section.slice(newline + 1).trim();
        const lines = body.split("\n").filter(Boolean);

        return (
          <div key={i}>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-primary inline-block" />
              {heading}
            </h4>
            <div className="space-y-1 pl-3">
              {lines.map((line, j) => {
                const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("+") || line.startsWith("−") || line.startsWith("*");
                const isPositive = line.startsWith("+");
                const isNegative = line.startsWith("−") || line.startsWith("- R") || line.startsWith("* R");
                const content = isBullet ? line.slice(1).trim() : line;
                return (
                  <p key={j} className={`text-sm leading-relaxed ${isBullet ? "flex items-start gap-2" : ""}`}>
                    {isBullet && (
                      <span className={`mt-1 shrink-0 text-xs font-bold ${isPositive ? "text-green-600" : isNegative ? "text-destructive" : "text-primary"}`}>
                        {isPositive ? "+" : isNegative ? "−" : "•"}
                      </span>
                    )}
                    <span>{content}</span>
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ScreenPage() {
  const params = useParams();
  const { data: criteriaSets } = useGetCriteriaSets();
  const screenMutation = useScreenStocks();
  const analyzeMutation = useAnalyzeStock();
  const watchMutation = useAddToWatchlist();
  const queryClient = useQueryClient();

  const [results, setResults] = useState<any[] | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [analyzingTicker, setAnalyzingTicker] = useState<string | null>(null);
  const [analysisTicker, setAnalysisTicker] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const criteriaSet = criteriaSets?.find(s => s.id === params.id);

  useEffect(() => {
    if (criteriaSet && !results && !screenMutation.isPending && !screenMutation.isSuccess) {
      screenMutation.mutate(
        { data: { criteria: criteriaSet.criteria } },
        {
          onSuccess: (data) => setResults(data),
          onError: () => toast({ variant: "destructive", title: "Screening Failed", description: "Could not process rules." })
        }
      );
    }
  }, [criteriaSet, results, screenMutation]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedResults = results ? [...results].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  }) : null;

  const handleAnalyze = (stock: any) => {
    setAnalyzingTicker(stock.ticker);
    setAnalysisTicker(stock.ticker);
    setAnalysisOpen(true);
    setCurrentAnalysis(null);

    const stockObj = {
      ticker: stock.ticker, name: stock.name, sector: stock.sector,
      price: stock.price, peRatio: stock.peRatio, debtToEquity: stock.debtToEquity,
      epsGrowth: stock.epsGrowth, dividendYield: stock.dividendYield, roe: stock.roe,
      revenueGrowth: stock.revenueGrowth, profitMargin: stock.profitMargin,
      currentRatio: stock.currentRatio, marketCapB: stock.marketCapB, beta: stock.beta,
      updatedAt: new Date().toISOString()
    };

    analyzeMutation.mutate(
      { data: { ticker: stock.ticker, stock: stockObj, criteria: criteriaSet!.criteria, score: stock.score } },
      {
        onSuccess: (data) => setCurrentAnalysis(data.explanation),
        onError: () => {
          setCurrentAnalysis("Failed to generate AI analysis. Please try again.");
          toast({ variant: "destructive", title: "Analysis Failed", description: "AI service unavailable." });
        },
        onSettled: () => setAnalyzingTicker(null)
      }
    );
  };

  const handleWatch = (ticker: string) => {
    watchMutation.mutate(
      { ticker },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
          toast({ title: "Added to Watchlist", description: `${ticker} is now tracked.` });
        }
      }
    );
  };

  if (!criteriaSet) {
    return <div className="p-8 text-muted-foreground">Loading criteria...</div>;
  }

  const passCount = results?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/criteria">
            <Button variant="outline" size="icon"><ArrowLeft size={18} /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Screen Results</h1>
            <p className="text-muted-foreground mt-1">Based on: <span className="font-semibold text-foreground">{criteriaSet.name}</span></p>
          </div>
        </div>
        <Button
          onClick={() => {
            setResults(null);
            screenMutation.mutate({ data: { criteria: criteriaSet.criteria } }, { onSuccess: setResults });
          }}
          disabled={screenMutation.isPending}
          variant="secondary"
          className="gap-2"
        >
          <Play size={16} /> Re-run
        </Button>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-2">
        <p className="text-sm font-semibold text-foreground mb-2">Screening rules:</p>
        <div className="flex flex-wrap gap-2">
          {criteriaSet.criteria.map((c, i) => (
            <Badge key={i} variant="outline" className="bg-background text-xs font-mono gap-1">
              <span className="text-muted-foreground">{METRIC_LABELS[c.metric] ?? c.metric}</span>
              <span className="text-foreground font-semibold">
                {OP_LABELS[c.operator] ?? c.operator} {c.value}{c.operator === "between" ? ` – ${c.value2}` : ""}
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {screenMutation.isPending || !sortedResults ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className={`flex items-center justify-between flex-wrap gap-3 p-4 rounded-lg border ${passCount > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-bold ${passCount > 0 ? "text-primary" : "text-muted-foreground"}`}>{passCount}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {passCount === 1 ? "stock matched" : "stocks matched"}
                </p>
                <p className="text-xs text-muted-foreground">out of 77 screened</p>
              </div>
            </div>

            {passCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium mr-1">Sort by:</span>
                {(["score", "price", "peRatio", "epsGrowth", "marketCapB"] as SortKey[]).map(k => (
                  <SortButton
                    key={k}
                    label={{ score: "Score", price: "Price", peRatio: "P/E", epsGrowth: "EPS Growth", marketCapB: "Mkt Cap" }[k]}
                    sortKey={k}
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                ))}
              </div>
            )}
          </div>

          {passCount === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
              <XCircle size={40} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-foreground">No stocks matched</h3>
              <p className="text-muted-foreground mt-2">Try relaxing your criteria to see more results.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedResults.map((result) => {
                const sectorColor = SECTOR_COLORS[result.sector] ?? "bg-muted text-muted-foreground";
                const scoreColor = result.score >= 80 ? "bg-emerald-500" : result.score >= 50 ? "bg-amber-500" : "bg-destructive";
                return (
                  <Card key={result.ticker} className="border-border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-2xl font-bold text-foreground">{result.ticker}</h3>
                              <Badge className={`${scoreColor} text-white border-0`}>Score {result.score}/100</Badge>
                              <Badge className={`border-0 text-xs ${sectorColor}`}>{result.sector}</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">{result.name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-mono font-bold text-foreground">${result.price?.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">per share</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-4">
                          {result.criteriaResults.map((cr: any, i: number) => (
                            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${cr.passed ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"}`}>
                              {cr.passed
                                ? <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                : <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />}
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground leading-tight truncate">
                                  {METRIC_LABELS[cr.metric] ?? cr.metric.replace(/_/g, " ")}
                                </p>
                                <p className="font-mono text-sm font-semibold leading-tight">
                                  {typeof cr.value === "number" ? cr.value.toFixed(1) : cr.value}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 md:w-52 bg-muted/10 flex flex-col justify-center gap-3">
                        <Button
                          className="w-full gap-2"
                          onClick={() => handleAnalyze(result)}
                          disabled={analyzingTicker === result.ticker}
                        >
                          <Cpu size={16} />
                          {analyzingTicker === result.ticker ? "Analyzing..." : "AI Analysis"}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => handleWatch(result.ticker)}
                          disabled={watchMutation.isPending}
                        >
                          <Eye size={16} /> Watchlist
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="text-primary" size={20} />
              AI Analysis — {analysisTicker}
            </DialogTitle>
            <DialogDescription>
              How this stock aligns with your <span className="font-medium text-foreground">{criteriaSet.name}</span> strategy.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {currentAnalysis ? (
              <AnalysisContent text={currentAnalysis} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Cpu size={36} className="animate-pulse mb-4 text-primary" />
                <p className="text-sm">Generating structured analysis...</p>
                <p className="text-xs mt-1 opacity-60">This takes about 5–10 seconds</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
