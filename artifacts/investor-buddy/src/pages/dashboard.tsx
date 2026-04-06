import { useGetDashboardSummary, useGetSectorBreakdown, useGetTopPerformers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Layers, Filter, Eye, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const SECTOR_COLORS: Record<string, { bar: string; badge: string }> = {
  Technology:  { bar: "bg-blue-500",   badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  Healthcare:  { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  Financial:   { bar: "bg-violet-500",  badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  Consumer:    { bar: "bg-orange-500",  badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  Industrial:  { bar: "bg-slate-500",   badge: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
  Energy:      { bar: "bg-yellow-500",  badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  Utilities:   { bar: "bg-teal-500",    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
};

function getColors(sector: string) {
  return SECTOR_COLORS[sector] ?? { bar: "bg-gray-400", badge: "bg-gray-100 text-gray-800" };
}

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: sectors, isLoading: loadingSectors } = useGetSectorBreakdown();
  const { data: topPerformers, isLoading: loadingPerformers } = useGetTopPerformers();

  const maxSectorCount = sectors ? Math.max(...sectors.map(s => s.count)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Market overview and your saved filters.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Stocks" value={summary?.totalStocks} icon={Building2} loading={loadingSummary} />
        <SummaryCard title="Sectors" value={summary?.sectorsCount} icon={Layers} loading={loadingSummary} />
        <SummaryCard title="Saved Criteria" value={summary?.totalCriteriaSets} icon={Filter} loading={loadingSummary} />
        <SummaryCard title="Watchlist" value={summary?.watchlistCount} icon={Eye} loading={loadingSummary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" /> Top Performers
                </CardTitle>
                <CardDescription>Highest EPS growth in the dataset</CardDescription>
              </div>
              <Link href="/stocks">
                <span className="text-xs text-primary hover:underline cursor-pointer">View all →</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPerformers ? (
              <div className="space-y-3 mt-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topPerformers && topPerformers.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ticker</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Sector</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">EPS Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((stock, idx) => {
                      const { badge } = getColors(stock.sector ?? "");
                      return (
                        <tr key={stock.ticker} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                          <td className="px-3 py-3 font-bold text-foreground">{stock.ticker}</td>
                          <td className="px-3 py-3 text-muted-foreground max-w-[140px] truncate text-xs">{stock.name}</td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <Badge className={`${badge} border-0 text-[10px] px-1.5 py-0`}>{stock.sector}</Badge>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-sm">${stock.price?.toFixed(2)}</td>
                          <td className="px-3 py-3 text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            +{stock.epsGrowth?.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Sector Breakdown</CardTitle>
            <CardDescription>Distribution of {summary?.totalStocks ?? 0} tracked stocks</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSectors ? (
              <div className="space-y-4 mt-4">
                {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : sectors && sectors.length > 0 ? (
              <div className="space-y-3 mt-4">
                {sectors
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((sector) => {
                    const pct = Math.round((sector.count / maxSectorCount) * 100);
                    const { bar, badge } = getColors(sector.sector ?? "");
                    return (
                      <div key={sector.sector}>
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`${badge} border-0 text-xs`}>{sector.sector}</Badge>
                          <span className="text-sm font-mono font-semibold text-foreground">{sector.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, loading }: {
  title: string;
  value?: number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <h3 className="text-3xl font-bold text-foreground tabular-nums">{value ?? 0}</h3>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon size={22} />
        </div>
      </CardContent>
    </Card>
  );
}
