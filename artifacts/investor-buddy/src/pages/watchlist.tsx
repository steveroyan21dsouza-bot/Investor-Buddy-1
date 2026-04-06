import { useGetWatchlist, useRemoveFromWatchlist, getGetWatchlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, EyeOff, BookmarkPlus } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const SECTOR_COLORS: Record<string, string> = {
  Technology:  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Healthcare:  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Financial:   "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  Consumer:    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Industrial:  "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  Energy:      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Utilities:   "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
};

export default function WatchlistPage() {
  const { data: watchlist, isLoading } = useGetWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const queryClient = useQueryClient();

  const handleRemove = (ticker: string) => {
    removeMutation.mutate(
      { ticker },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
          toast({ title: "Removed", description: `${ticker} removed from watchlist.` });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Watchlist</h1>
        <p className="text-muted-foreground mt-1">Your shortlisted candidates from screening runs.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tracked Stocks</CardTitle>
              {watchlist && watchlist.length > 0 && (
                <CardDescription>{watchlist.length} stock{watchlist.length !== 1 ? "s" : ""} on your list</CardDescription>
              )}
            </div>
            <Link href="/stocks">
              <Button variant="outline" size="sm" className="gap-2">
                <BookmarkPlus size={14} /> Add More
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : watchlist && watchlist.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Sector</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">P/E</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Div. Yield</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Added</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((item, idx) => {
                    const sectorColor = SECTOR_COLORS[item.sector ?? ""] ?? "bg-muted text-muted-foreground";
                    return (
                      <tr key={item.ticker} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {item.ticker.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{item.ticker}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[120px]">{item.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <Badge className={`${sectorColor} border-0 text-xs`}>{item.sector}</Badge>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-foreground">
                          ${item.price?.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-muted-foreground text-xs hidden md:table-cell">
                          {item.peRatio != null ? `${item.peRatio.toFixed(1)}x` : "—"}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-muted-foreground text-xs hidden md:table-cell">
                          {item.dividendYield != null && item.dividendYield > 0 ? `${item.dividendYield.toFixed(2)}%` : "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                          {format(new Date(item.addedAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.ticker)}
                            disabled={removeMutation.isPending}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                <EyeOff size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Nothing here yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">
                Run a screen and click <strong>Watchlist</strong> on any result to start tracking stocks here.
              </p>
              <Link href="/criteria">
                <Button className="gap-2">
                  <BookmarkPlus size={16} /> Run a Screen First
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
