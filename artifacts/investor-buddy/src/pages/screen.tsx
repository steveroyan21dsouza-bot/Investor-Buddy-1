import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetCriteriaSets, useScreenStocks, useAnalyzeStock, useAddToWatchlist, getGetWatchlistQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, Cpu, Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

  const handleAnalyze = (stock: any) => {
    setAnalyzingTicker(stock.ticker);
    setAnalysisOpen(true);
    setCurrentAnalysis(null);
    
    // Create stock object
    const stockObj = {
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      price: stock.price,
      peRatio: stock.peRatio,
      debtToEquity: stock.debtToEquity,
      epsGrowth: stock.epsGrowth,
      dividendYield: stock.dividendYield,
      roe: stock.roe,
      revenueGrowth: stock.revenueGrowth,
      profitMargin: stock.profitMargin,
      currentRatio: stock.currentRatio,
      marketCapB: stock.marketCapB,
      beta: stock.beta,
      updatedAt: new Date().toISOString()
    };

    analyzeMutation.mutate(
      { data: { ticker: stock.ticker, stock: stockObj, criteria: criteriaSet!.criteria, score: stock.score } },
      {
        onSuccess: (data) => setCurrentAnalysis(data.explanation),
        onError: () => {
          setCurrentAnalysis("Failed to generate AI analysis.");
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
    return <div className="p-8">Loading criteria...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
        <span className="text-sm font-semibold mr-2 flex items-center">Rules applied:</span>
        {criteriaSet.criteria.map((c, i) => (
          <Badge key={i} variant="outline" className="bg-background text-xs font-mono">
            {c.metric} {c.operator} {c.value} {c.operator === 'between' ? ` & ${c.value2}` : ''}
          </Badge>
        ))}
      </div>

      {screenMutation.isPending || !results ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <h3 className="text-lg font-bold text-foreground">No stocks matched</h3>
          <p className="text-muted-foreground mt-2">Try relaxing your criteria to see more results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.ticker} className="border-border overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-bold text-foreground">{result.ticker}</h3>
                        <Badge className={result.score >= 80 ? "bg-primary" : result.score >= 50 ? "bg-yellow-500" : "bg-destructive"}>
                          Score: {result.score}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{result.name} • {result.sector}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-mono">${result.price.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {result.criteriaResults.map((cr: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                        {cr.passed ? <CheckCircle2 size={16} className="text-primary shrink-0" /> : <XCircle size={16} className="text-destructive shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">{cr.metric.replace(/_/g, ' ')}</p>
                          <p className="font-mono text-sm font-medium">{cr.value.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 md:w-64 bg-muted/10 flex flex-col justify-center gap-3">
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
                    <Eye size={16} /> Watch
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="text-primary" /> AI Stock Analysis
            </DialogTitle>
            <DialogDescription>
              Deep dive into how this stock aligns with your criteria strategy.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-md min-h-[200px] border border-border">
            {currentAnalysis ? (
              <div className="prose prose-sm dark:prose-invert max-w-none font-sans leading-relaxed">
                {currentAnalysis.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground h-[200px]">
                <Cpu size={32} className="animate-pulse mb-4 text-primary" />
                <p>Generating insights based on financial data...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}