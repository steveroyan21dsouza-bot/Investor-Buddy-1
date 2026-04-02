import { useGetWatchlist, useRemoveFromWatchlist, getGetWatchlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, EyeOff, BookmarkPlus } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Watchlist</h1>
        <p className="text-muted-foreground mt-1">Monitor your highly-rated candidates.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-0">
          <CardTitle>Tracked Assets</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : watchlist && watchlist.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Asset</th>
                    <th className="px-4 py-3 font-medium">Sector</th>
                    <th className="px-4 py-3 font-medium text-right">Current Price</th>
                    <th className="px-4 py-3 font-medium">Added On</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {watchlist.map((item) => (
                    <tr key={item.ticker} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {item.ticker.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-base">{item.ticker}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/10 text-secondary-foreground text-xs font-medium">
                          {item.sector}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-medium text-lg">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">
                        {format(new Date(item.addedAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemove(item.ticker)}
                          disabled={removeMutation.isPending}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="text-center py-16 flex flex-col items-center">
               <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                 <EyeOff size={32} />
               </div>
               <h3 className="text-lg font-bold text-foreground">Watchlist is empty</h3>
               <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">Browse the market universe and click the bookmark icon on any stock to start tracking it here.</p>
               <Link href="/stocks">
                 <Button className="gap-2">
                   <BookmarkPlus size={16} /> Browse Stocks to Add
                 </Button>
               </Link>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}