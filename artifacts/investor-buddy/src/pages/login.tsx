import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { setToken } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";

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
        }
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
        }
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <TrendingUp size={28} />
        </div>
        <span className="font-bold text-3xl tracking-tight text-foreground">InvestorBuddy</span>
      </div>

      <Card className="w-full max-w-md border-border shadow-xl">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none border-b h-12">
            <TabsTrigger value="login" className="data-[state=active]:bg-card data-[state=active]:text-primary h-full rounded-none">Login</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-card data-[state=active]:text-primary h-full rounded-none">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="m-0">
            <form onSubmit={handleLogin}>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your credentials to access your cockpit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="investor@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="register" className="m-0">
            <form onSubmit={handleRegister}>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Start making data-driven investment decisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="investor@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating account..." : "Register"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
