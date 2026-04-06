import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { setToken } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Filter, Cpu, Eye } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setLocation("/dashboard");
          toast({ title: "Welcome back", description: "Successfully logged in." });
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Login failed", description: error.message || "Invalid credentials." });
        },
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setLocation("/dashboard");
          toast({ title: "Account created", description: "Welcome to InvestorBuddy." });
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Registration failed", description: error.message || "Could not create account." });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 border-r border-border flex-col items-center justify-center p-12 gap-10">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg mx-auto mb-6">
            <TrendingUp size={36} />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">InvestorBuddy</h1>
          <p className="text-muted-foreground text-base mb-1">ENTI 674 — Applied Investing</p>
          <p className="text-muted-foreground/70 text-sm">Haskayne School of Business</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          {[
            { icon: Filter, title: "Custom Screening", desc: "Define rules using P/E, EPS growth, ROE, and 7 more metrics" },
            { icon: Cpu, title: "AI Analysis", desc: "Claude-powered plain-language breakdown of every result" },
            { icon: Eye, title: "Watchlist", desc: "Track your best candidates across screening runs" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Icon size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 text-center max-w-xs">
          Screening across 77 S&P 500 stocks · Built with React, Express, and Anthropic Claude
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <TrendingUp size={26} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">InvestorBuddy</h1>
            <p className="text-xs text-muted-foreground">ENTI 674 · Haskayne School of Business</p>
          </div>
        </div>

        <Card className="w-full max-w-sm border-border shadow-xl">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-t-xl rounded-b-none border-b h-12">
              <TabsTrigger value="login" className="data-[state=active]:bg-card data-[state=active]:text-primary h-full rounded-none">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-card data-[state=active]:text-primary h-full rounded-none">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="m-0">
              <form onSubmit={handleLogin}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>Sign in to access your screening tools.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="register" className="m-0">
              <form onSubmit={handleRegister}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Create an account</CardTitle>
                  <CardDescription>Get started with custom stock screening.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
