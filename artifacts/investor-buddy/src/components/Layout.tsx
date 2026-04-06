import { Link, useLocation } from "wouter";
import { LayoutDashboard, Filter, Eye, LineChart, LogOut, TrendingUp } from "lucide-react";
import { removeToken } from "../lib/auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/criteria", label: "Criteria", icon: Filter },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/stocks", label: "Stocks", icon: LineChart },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    removeToken();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Sidebar — desktop only */}
      <div className="w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-base tracking-tight leading-tight">InvestorBuddy</div>
            <div className="text-xs text-sidebar-foreground/50 leading-tight truncate">ENTI 674 · Haskayne</div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="h-14 bg-card border-b border-border flex items-center px-4 md:hidden gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">InvestorBuddy</div>
            <div className="text-xs text-muted-foreground leading-tight">ENTI 674 · Haskayne</div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut size={17} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-stretch z-50">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon size={20} />
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
