import { useGetCriteriaSets, useDeleteCriteriaSet, useGetStocks } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Plus, Play, Edit, Trash2, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCriteriaSetsQueryKey } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";

const METRIC_LABELS: Record<string, string> = {
  pe_ratio: "P/E Ratio",
  debt_to_equity: "Debt/Equity",
  eps_growth: "EPS Growth",
  dividend_yield: "Div. Yield",
  roe: "ROE",
  revenue_growth: "Rev. Growth",
  profit_margin: "Profit Margin",
  current_ratio: "Current Ratio",
  market_cap_b: "Market Cap ($B)",
  beta: "Beta",
};

const OP_SYMBOLS: Record<string, string> = {
  "<": "<",
  "<=": "≤",
  ">": ">",
  ">=": "≥",
  between: "between",
};

export default function CriteriaPage() {
  const { data: criteriaSets, isLoading } = useGetCriteriaSets();
  const { data: stocks } = useGetStocks();
  const stockCount = stocks?.length ?? 0;
  const deleteMutation = useDeleteCriteriaSet();
  const queryClient = useQueryClient();

  const handleDelete = (id: string) => {
    if (confirm("Delete this criteria set? This cannot be undone.")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetCriteriaSetsQueryKey() });
            toast({ title: "Deleted", description: "Criteria set removed." });
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Criteria Library</h1>
          <p className="text-muted-foreground mt-1">Build and run custom stock screening rules.</p>
        </div>
        <Link href="/criteria/new">
          <Button className="gap-2">
            <Plus size={16} /> New Criteria Set
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      ) : criteriaSets && criteriaSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criteriaSets.map((set) => (
            <Card key={set.id} className="flex flex-col border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">{set.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {set.criteria.length} {set.criteria.length === 1 ? "rule" : "rules"} defined
                </p>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-1.5">
                  {set.criteria.slice(0, 4).map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md text-xs">
                      <span className="text-muted-foreground font-medium truncate">
                        {METRIC_LABELS[c.metric] ?? c.metric.replace(/_/g, " ")}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 shrink-0 text-primary border-primary/30">
                        {OP_SYMBOLS[c.operator] ?? c.operator}
                      </Badge>
                      <span className="font-mono font-semibold text-foreground shrink-0">
                        {c.value}{c.operator === "between" ? ` – ${c.value2}` : ""}
                      </span>
                    </div>
                  ))}
                  {set.criteria.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {set.criteria.length - 4} more rule{set.criteria.length - 4 > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t border-border flex gap-2">
                <Link href={`/screen/${set.id}`} className="flex-1">
                  <Button variant="default" className="w-full gap-2" size="sm">
                    <Play size={14} /> Run Screen
                  </Button>
                </Link>
                <Link href={`/criteria/${set.id}/edit`}>
                  <Button variant="outline" size="sm" className="px-3">
                    <Edit size={14} />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  onClick={() => handleDelete(set.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <Filter size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground">No criteria sets yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">
            Create a criteria set to filter {stockCount > 0 ? stockCount : "120+"} stocks by valuation, growth, profitability, and risk.
          </p>
          <Link href="/criteria/new">
            <Button>Create your first set</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
