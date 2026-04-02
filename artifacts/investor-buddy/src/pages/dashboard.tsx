import { useGetDashboardSummary, useGetSectorBreakdown, useGetTopPerformers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Layers, Filter, Eye } from "lucide-react";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: sectors, isLoading: loadingSectors } = useGetSectorBreakdown();
  const { data: topPerformers, isLoading: loadingPerformers } = useGetTopPerformers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Market overview and your saved filters.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Stocks" 
          value={summary?.totalStocks} 
          icon={Building2} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Active Sectors" 
          value={summary?.sectorsCount} 
          icon={Layers} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Saved Criteria" 
          value={summary?.totalCriteriaSets} 
          icon={Filter} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Watchlist Items" 
          value={summary?.watchlistCount} 
          icon={Eye} 
          loading={loadingSummary} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Highest 1-year EPS growth in the dataset</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPerformers ? (
              <div className="space-y-3 mt-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topPerformers && topPerformers.length > 0 ? (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ticker</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium text-right">Price</th>
                      <th className="px-4 py-3 font-medium text-right">EPS Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topPerformers.map(stock => (
                      <tr key={stock.ticker} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">{stock.ticker}</td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">{stock.name}</td>
                        <td className="px-4 py-3 text-right font-mono">${stock.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary">
                          +{stock.epsGrowth.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Sector Breakdown */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Sectors</CardTitle>
            <CardDescription>Distribution of tracked stocks</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSectors ? (
              <div className="space-y-4 mt-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : sectors && sectors.length > 0 ? (
              <div className="space-y-3 mt-4">
                {sectors.map((sector) => (
                  <div key={sector.sector} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{sector.sector}</span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded-md">{sector.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, loading }: { title: string, value?: number, icon: any, loading: boolean }) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <h3 className="text-3xl font-bold text-foreground">{value ?? 0}</h3>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={24} />
        </div>
      </CardContent>
    </Card>
  );
}