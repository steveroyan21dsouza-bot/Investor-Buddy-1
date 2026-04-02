import { useGetCriteriaSets, useDeleteCriteriaSet } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Plus, Play, Edit, Trash2, Database, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCriteriaSetsQueryKey } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";

export default function CriteriaPage() {
  const { data: criteriaSets, isLoading } = useGetCriteriaSets();
  const deleteMutation = useDeleteCriteriaSet();
  const queryClient = useQueryClient();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this criteria set?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetCriteriaSetsQueryKey() });
            toast({ title: "Deleted", description: "Criteria set removed." });
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Criteria Library</h1>
          <p className="text-muted-foreground mt-1">Manage your custom stock screening algorithms.</p>
        </div>
        <Link href="/criteria/new">
          <Button className="gap-2">
            <Plus size={16} /> New Criteria Set
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : criteriaSets && criteriaSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criteriaSets.map((set) => (
            <Card key={set.id} className="flex flex-col border-border shadow-sm hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-start justify-between">
                  <span className="truncate">{set.name}</span>
                </CardTitle>
                <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                  <Database size={12} /> {set.criteria.length} rules defined
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  {set.criteria.slice(0, 3).map((c, i) => (
                    <div key={i} className="text-sm flex items-center gap-2 bg-muted/50 p-2 rounded">
                      <span className="font-mono text-xs font-semibold">{c.metric.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="text-primary font-bold">{c.operator}</span>
                      <span className="font-mono">{c.value}</span>
                      {c.operator === 'between' && <span className="font-mono text-muted-foreground">and {c.value2}</span>}
                    </div>
                  ))}
                  {set.criteria.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center pt-1">+ {set.criteria.length - 3} more</div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t border-border mt-4 flex gap-2 pt-4">
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
                <Button variant="outline" size="sm" className="px-3 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={() => handleDelete(set.id)} disabled={deleteMutation.isPending}>
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
          <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-6">Create a criteria set to filter stocks by valuation, growth, debt, and other financial metrics.</p>
          <Link href="/criteria/new">
            <Button>Create your first set</Button>
          </Link>
        </div>
      )}
    </div>
  );
}