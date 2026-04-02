import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border-border shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center mb-4 text-destructive">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">
            The data endpoint you are looking for does not exist.
          </p>
          <div className="pt-4">
            <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Return Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
