import { useState } from "react";
import {
  useGetStocks,
  useGetStock,
  useGetWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useSearchStocks,
  useAddStock,
  useDeleteStock,
  useRefreshAllStocks,
  getGetWatchlistQueryKey,
  getGetStocksQueryKey,
} from "@workspace/api-client-react";
import { useLivePrices, LivePriceCell, LiveTimestamp } from "@/components/LivePrice";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Info, Bookmark, BookmarkCheck, Plus, Trash2, RefreshCw, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function StocksPage() {
  const { data: stocks, isLoading } = useGetStocks();
  const { data: watchlist } = useGetWatchlist();
  const [search, setSearch] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [avSearch, setAvSearch] = useState("");
  const [avQuery, setAvQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const queryClient = useQueryClient();

  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const addStockMutation = useAddStock();
  const deleteStockMutation = useDeleteStock();
  const refreshAllMutation = useRefreshAllStocks();

  const handleRefreshAll = () => {
    refreshAllMutation.mutate(undefined, {
      onSuccess: () => toast({
        title: "Price refresh started",
        description: "All stock prices will update over the next ~2 minutes. Reload the page when done.",
      }),
      onError: () => toast({ variant: "destructive", title: "Refresh failed", description: "Could not start refresh. Check FINNHUB_API_KEY." }),
    });
  };

  const tickers = (stocks ?? []).map(s => s.ticker);
  const { quotes } = useLivePrices(tickers, !isLoading && tickers.length > 0);

  const { data: searchResults, isFetching: isSearching } = useSearchStocks(avQuery, {
    query: { enabled: avQuery.length >= 2 },
  });

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

  const handleAddStock = (ticker: string, name: string) => {
    addStockMutation.mutate({ ticker }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStocksQueryKey() });
        toast({ title: "Stock Added", description: `${name} (${ticker}) added to the database.` });
        setAvSearch("");
        setAvQuery("");
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message || "Failed to add stock." }),
    });
  };

  const handleDeleteStock = (ticker: string) => {
    if (!confirm(`Remove ${ticker} from the database? This will also remove it from any watchlists.`)) return;
    deleteStockMutation.mutate({ ticker }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStocksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        toast({ title: "Removed", description: `${ticker} removed from database.` });
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to remove stock." }),
    });
  };

  const isBusy = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Market Universe</h1>
          <p className="text-muted-foreground mt-1">Browse all available equities and their fundamentals.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Filter tickers, names..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={handleRefreshAll}
            disabled={refreshAllMutation.isPending}
            title="Refresh all stock prices via Finnhub (runs in background ~2 min)"
          >
            <RefreshCw size={16} className={refreshAllMutation.isPending ? "animate-spin" : ""} />
            Refresh Prices
          </Button>
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Plus size={16} /> Add Stock
          </Button>
        </div>
      </div>

      {showSearch && (
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Search Alpha Vantage</h3>
            <Button variant="ghost" size="icon" onClick={() => { setShowSearch(false); setAvSearch(""); setAvQuery(""); }}>
              <X size={16} />
            </Button>
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Search by company name or ticker..."
              value={avSearch}
              onChange={(e) => setAvSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setAvQuery(avSearch); }}
              className="flex-1"
            />
            <Button onClick={() => setAvQuery(avSearch)} disabled={avSearch.length < 2 || isSearching}>
              {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
          </div>
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map(r => (
                <div key={r.ticker} className="flex items-center justify-between p-2 rounded border border-border bg-muted/20 text-sm">
                  <div>
                    <span className="font-bold text-foreground">{r.ticker}</span>
                    <span className="text-muted-foreground ml-2">{r.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{r.type}</Badge>
                  </div>
                  {r.inDatabase ? (
                    <Badge variant="secondary" className="text-xs">Already added</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      disabled={addStockMutation.isPending}
                      onClick={() => handleAddStock(r.ticker, r.name)}
                    >
                      <Plus size={14} /> Add
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          {avQuery && searchResults?.length === 0 && !isSearching && (
            <p className="text-sm text-muted-foreground text-center py-4">No US-listed stocks found for "{avQuery}"</p>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Requires Alpha Vantage API key. Free tier allows 25 requests/day.
          </p>
        </Card>
      )}

      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium text-right">
                  <span className="flex flex-col items-end gap-0.5">
                    Price <LiveTimestamp quotes={quotes} />
                  </span>
                </th>
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
                      <td className="px-4 py-3 text-right">
                        <LivePriceCell ticker={stock.ticker} fallbackPrice={stock.price} quotes={quotes} />
                      </td>
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
                          <Button variant="ghost" size="icon" onClick={() => setSelectedTicker(stock.ticker)} title="View details">
                            <Info size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remove from database"
                            disabled={deleteStockMutation.isPending}
                            onClick={() => handleDeleteStock(stock.ticker)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
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
                {[
                  { label: "Market Cap", value: `$${stock.marketCapB.toFixed(1)}B` },
                  { label: "Beta", value: stock.beta.toFixed(2) },
                  { label: "Current Ratio", value: stock.currentRatio.toFixed(2) },
                  { label: "P/E Ratio", value: stock.peRatio.toFixed(1) },
                  { label: "EPS Growth", value: `${stock.epsGrowth.toFixed(1)}%` },
                  { label: "ROE", value: `${stock.roe.toFixed(1)}%` },
                  { label: "Revenue Growth", value: `${stock.revenueGrowth.toFixed(1)}%` },
                  { label: "Profit Margin", value: `${stock.profitMargin.toFixed(1)}%` },
                  { label: "Dividend Yield", value: `${stock.dividendYield.toFixed(2)}%` },
                ].map(item => (
                  <div key={item.label} className="bg-card p-3 rounded shadow-sm border border-border">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="font-mono text-lg">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
