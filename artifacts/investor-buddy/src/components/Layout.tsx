import { Link, useLocation } from "wouter";
import { LayoutDashboard, Filter, Eye, LineChart, LogOut, TrendingUp } from "lucide-react";
import { removeToken } from "../lib/auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    removeToken();
    setLocation("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/criteria", label: "Criteria", icon: Filter },
    { href: "/watchlist", label: "Watchlist", icon: Eye },
    { href: "/stocks", label: "All Stocks", icon: LineChart },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <TrendingUp size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">InvestorBuddy</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center px-6 md:hidden">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground mr-3">
            <TrendingUp size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">InvestorBuddy</span>
          <div className="ml-auto">
            {/* Mobile menu could go here */}
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
