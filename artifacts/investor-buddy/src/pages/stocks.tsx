import { useState } from "react";
import {
  useGetStocks,
  useGetStock,
  useGetWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  getGetWatchlistQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Info, Bookmark, BookmarkCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function StocksPage() {
  const { data: stocks, isLoading } = useGetStocks();
  const { data: watchlist } = useGetWatchlist();
  const [search, setSearch] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  const watchlistSet = new Set((watchlist || []).map((w) => w.ticker));

  const filteredStocks = stocks?.filter(s =>
    s.ticker.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.sector.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const toggleWatchlist = (ticker: string) => {
    const inWatchlist = watchlistSet.has(ticker);
    if (inWatchlist) {
      removeMutation.mutate({ ticker }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
          toast({ title: "Removed", description: `${ticker} removed from watchlist.` });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to remove." }),
      });
    } else {
      addMutation.mutate({ ticker }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
          toast({ title: "Added", description: `${ticker} added to watchlist.` });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to add." }),
      });
    }
  };

  const isBusy = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Market Universe</h1>
          <p className="text-muted-foreground mt-1">Browse all available equities and their fundamentals.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search tickers, names, sectors..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">P/E</th>
                <th className="px-4 py-3 font-medium text-right">EPS Gr %</th>
                <th className="px-4 py-3 font-medium text-right">Rev Gr %</th>
                <th className="px-4 py-3 font-medium text-right">Margin %</th>
                <th className="px-4 py-3 font-medium text-right">ROE %</th>
                <th className="px-4 py-3 font-medium text-right">D/E</th>
                <th className="px-4 py-3 font-medium text-right">Yield %</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td>
                  </tr>
                ))
              ) : filteredStocks.length > 0 ? (
                filteredStocks.map(stock => {
                  const watched = watchlistSet.has(stock.ticker);
                  return (
                    <tr key={stock.ticker} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{stock.ticker}</div>
                        <div className="text-xs text-muted-foreground truncate w-32" title={stock.name}>{stock.name}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">${stock.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono">{stock.peRatio.toFixed(1)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${stock.epsGrowth > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {stock.epsGrowth > 0 ? '+' : ''}{stock.epsGrowth.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${stock.revenueGrowth > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {stock.revenueGrowth > 0 ? '+' : ''}{stock.revenueGrowth.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{stock.profitMargin.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-mono">{stock.roe.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right font-mono">{stock.debtToEquity.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono">{stock.dividendYield.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={watched ? "Remove from watchlist" : "Add to watchlist"}
                            disabled={isBusy}
                            onClick={() => toggleWatchlist(stock.ticker)}
                            className={watched
                              ? "text-primary hover:text-primary/80 hover:bg-primary/10"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            }
                          >
                            {watched ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedTicker(stock.ticker)}>
                            <Info size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    No stocks found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <StockDetailsModal
        ticker={selectedTicker}
        open={!!selectedTicker}
        onOpenChange={(open) => !open && setSelectedTicker(null)}
        watchlistSet={watchlistSet}
        onToggleWatchlist={toggleWatchlist}
        isBusy={isBusy}
      />
    </div>
  );
}

function StockDetailsModal({
  ticker,
  open,
  onOpenChange,
  watchlistSet,
  onToggleWatchlist,
  isBusy,
}: {
  ticker: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlistSet: Set<string>;
  onToggleWatchlist: (ticker: string) => void;
  isBusy: boolean;
}) {
  const { data: stock, isLoading } = useGetStock(ticker || "", {
    query: { enabled: !!ticker, queryKey: ["getGetStock", ticker] },
  });

  const watched = ticker ? watchlistSet.has(ticker) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{ticker} Details</DialogTitle>
          <DialogDescription>In-depth fundamental view</DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-muted/30 rounded-md border border-border">
          {isLoading || !stock ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold">{stock.name}</h3>
                  <p className="text-muted-foreground">{stock.sector} • ${stock.price.toFixed(2)}</p>
                </div>
                <Button
                  variant={watched ? "default" : "outline"}
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onToggleWatchlist(stock.ticker)}
                  className="gap-2 shrink-0"
                >
                  {watched ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  {watched ? "Watching" : "Add to Watchlist"}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-card p-3 rounded shadow-sm border border-border">
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                  <div className="font-mono text-lg">${stock.marketCapB.toFixed(1)}B</div>
                </div>
                <div className="bg-card p-3 rounded shadow-sm border border-border">
                  <div className="text-xs text-muted-foreground">Beta</div>
                  <div className="font-mono text-lg">{stock.beta.toFixed(2)}</div>
                </div>
                <div className="bg-card p-3 rounded shadow-sm border border-border">
                  <div className="text-xs text-muted-foreground">Current Ratio</div>
                  <div className="font-mono text-lg">{stock.currentRatio.toFixed(2)}</div>
                </div>
                <div className="bg-card p-3 rounded shadow-sm border border-border">
                  <div className="text-xs text-muted-foreground">P/E Ratio</div>
                  <div className="font-mono text-lg">{stock.peRatio.toFixed(1)}</div>
                </div>
                <div className="bg-card p-3 rounded shadow-sm border border-border">
                  <div className="text-xs text-muted-foreground">EPS Growth</div>
                  <div className="font-mono text-lg">{stock.epsGrowth.toFixed(1)}%</div>
                </div>
                <div className="bg-card p-3 rounded shadow-sm border border-border">
                  <div className="text-xs text-muted-foreground">ROE</div>
                  <div className="font-mono text-lg">{stock.roe.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
