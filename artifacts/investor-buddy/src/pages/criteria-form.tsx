import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useCreateCriteriaSet, useUpdateCriteriaSet, useGetCriteriaSets, getGetCriteriaSetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CriterionOperator } from "@workspace/api-client-react";

const METRICS = [
  { value: "pe_ratio", label: "P/E Ratio" },
  { value: "eps_growth", label: "EPS Growth (%)" },
  { value: "revenue_growth", label: "Revenue Growth (%)" },
  { value: "profit_margin", label: "Profit Margin (%)" },
  { value: "debt_to_equity", label: "Debt to Equity" },
  { value: "current_ratio", label: "Current Ratio" },
  { value: "dividend_yield", label: "Dividend Yield (%)" },
  { value: "roe", label: "Return on Equity (%)" },
  { value: "market_cap_b", label: "Market Cap ($B)" },
  { value: "beta", label: "Beta" }
];

const OPERATORS = [
  { value: ">", label: "Greater than (>)" },
  { value: "<", label: "Less than (<)" },
  { value: ">=", label: "Greater or equal (>=)" },
  { value: "<=", label: "Less or equal (<=)" },
  { value: "between", label: "Between" }
];

export default function CriteriaFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id && params.id !== "new";
  const queryClient = useQueryClient();
  
  const { data: criteriaSets } = useGetCriteriaSets();
  
  const createMutation = useCreateCriteriaSet();
  const updateMutation = useUpdateCriteriaSet();

  const [name, setName] = useState("");
  const [criteria, setCriteria] = useState<any[]>([
    { metric: "pe_ratio", operator: "<=", value: 20, value2: null }
  ]);

  useEffect(() => {
    if (isEditing && criteriaSets) {
      const set = criteriaSets.find(s => s.id === params.id);
      if (set) {
        setName(set.name);
        setCriteria(set.criteria);
      }
    }
  }, [isEditing, criteriaSets, params.id]);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { metric: "eps_growth", operator: ">", value: 10, value2: null }]);
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleUpdateCriterion = (index: number, field: string, value: any) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Missing Name", description: "Please provide a name for this criteria set." });
      return;
    }
    if (criteria.length === 0) {
      toast({ variant: "destructive", title: "Empty Criteria", description: "Please add at least one criterion." });
      return;
    }

    // Process numeric values
    const processedCriteria = criteria.map(c => ({
      metric: c.metric,
      operator: c.operator as CriterionOperator,
      value: Number(c.value),
      value2: c.operator === "between" ? Number(c.value2) : null
    }));

    const payload = { name, criteria: processedCriteria };

    if (isEditing && params.id) {
      updateMutation.mutate(
        { id: params.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetCriteriaSetsQueryKey() });
            toast({ title: "Saved", description: "Criteria set updated." });
            setLocation("/criteria");
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetCriteriaSetsQueryKey() });
            toast({ title: "Created", description: "New criteria set added." });
            setLocation("/criteria");
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => setLocation("/criteria")}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isEditing ? "Edit Criteria Set" : "Build Criteria Set"}
          </h1>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Name your screening strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="name">Strategy Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Value & Growth Hybrid" 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Rules</CardTitle>
            <CardDescription>Define the metrics stocks must pass</CardDescription>
          </div>
          <Button onClick={handleAddCriterion} variant="secondary" size="sm" className="gap-1">
            <Plus size={16} /> Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {criteria.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              No rules added. Stocks will not be filtered.
            </div>
          ) : (
            criteria.map((c, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-muted/30 p-3 rounded-lg border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Metric</Label>
                    <Select value={c.metric} onValueChange={(v) => handleUpdateCriterion(i, "metric", v)}>
                      <SelectTrigger><SelectValue placeholder="Metric" /></SelectTrigger>
                      <SelectContent>
                        {METRICS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Operator</Label>
                    <Select value={c.operator} onValueChange={(v) => handleUpdateCriterion(i, "operator", v)}>
                      <SelectTrigger><SelectValue placeholder="Operator" /></SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Value</Label>
                    <Input 
                      type="number" 
                      value={c.value} 
                      onChange={(e) => handleUpdateCriterion(i, "value", e.target.value)} 
                    />
                  </div>
                  {c.operator === "between" ? (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Upper Value</Label>
                      <Input 
                        type="number" 
                        value={c.value2 || ""} 
                        onChange={(e) => handleUpdateCriterion(i, "value2", e.target.value)} 
                      />
                    </div>
                  ) : <div className="hidden sm:block"></div>}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveCriterion(i)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))
          )}
        </CardContent>
        <div className="p-6 pt-0 mt-4 border-t border-border flex justify-end">
          <Button onClick={handleSave} className="gap-2 w-full sm:w-auto" disabled={createMutation.isPending || updateMutation.isPending}>
            <Save size={16} /> 
            {isEditing ? "Save Changes" : "Create Strategy"}
          </Button>
        </div>
      </Card>
    </div>
  );
}