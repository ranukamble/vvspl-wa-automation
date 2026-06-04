import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  History,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Smartphone,
  Sun,
  Users,
  Users2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/campaigns", label: "Campaigns", icon: Megaphone },
  { path: "/contacts", label: "Contacts", icon: Users },
  { path: "/history", label: "History", icon: History },
  { path: "/whatsapp", label: "Clients", icon: Smartphone },
  { path: "/groups", label: "Groups", icon: Users2 },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campaigns",
  "/contacts": "Contacts",
  "/history": "Message History",
  "/whatsapp": "WhatsApp Clients",
  "/groups": "Groups",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      data-ocid="theme.toggle"
      className="h-9 w-9 rounded-lg border border-border hover:bg-accent/10 transition-smooth"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: clients = [] } = useClients();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const connectedCount = clients.filter((c) => c.status === "connected").length;
  const pageTitle = pageTitles[currentPath] ?? "Dashboard";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Enter" && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-card border-r border-border transition-smooth",
          "lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-base text-foreground leading-none">
              VVSPL WA
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Automation</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            data-ocid="sidebar.close_button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3 space-y-1"
          data-ocid="sidebar.nav"
        >
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = currentPath === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                data-ocid={`nav.${label.toLowerCase().replace(" ", "_")}.link`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()}{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 lg:px-6 h-14 bg-card border-b border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-ocid="sidebar.open_modal_button"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="font-display font-semibold text-lg text-foreground flex-1 truncate">
            {pageTitle}
          </h1>

          {/* Connected clients badge */}
          <div
            className="flex items-center gap-2"
            data-ocid="header.clients_badge"
          >
            <span className="text-xs text-muted-foreground hidden sm:block">
              Connected
            </span>
            <Badge
              variant={connectedCount > 0 ? "default" : "secondary"}
              className={cn(
                "text-xs font-mono tabular-nums",
                connectedCount > 0 && "bg-primary text-primary-foreground",
              )}
            >
              {connectedCount} / {clients.length}
            </Badge>
          </div>

          <ThemeToggle />
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto bg-background"
          data-ocid="main.content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
