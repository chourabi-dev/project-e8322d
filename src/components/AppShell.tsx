import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Tags,
  MonitorPlay,
  ReceiptText,
  ChartNoAxesCombined,
  Users,
  Settings,
  Menu,
  Moon,
  Sun,
  LogOut,
  Search,
  Bell,
  ChevronsLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/restaurants", label: "Restaurants", icon: Store },
  { to: "/products", label: "Products", icon: UtensilsCrossed },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/kitchen", label: "Kitchen Screens", icon: MonitorPlay },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/users", label: "Users", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Brand({ compact }: { compact?: boolean | undefined }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-1">
      <span className="gradient-primary grid size-9 place-items-center rounded-xl text-primary-foreground shadow-soft">
        <UtensilsCrossed className="size-4.5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-sm font-semibold">Aveline</span>
          <span className="block text-[11px] text-muted-foreground">Restaurant OS</span>
        </span>
      )}
    </Link>
  );
}

function NavList({
  compact,
  onNavigate,
}: {
  compact?: boolean | undefined;
  onNavigate?: (() => void) | undefined;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon
              className={cn("size-4.5 shrink-0", active ? "text-primary" : "opacity-80")}
            />
            {!compact && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  compact,
  onNavigate,
}: {
  compact?: boolean | undefined;
  onNavigate?: (() => void) | undefined;
}) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col gap-6 p-3">
      <div className="pt-2">
        <Brand compact={compact} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavList compact={compact} onNavigate={onNavigate} />
      </div>
      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
        {!compact && (
          <>
            <p className="truncate text-sm font-medium">{session?.name ?? "Guest"}</p>
            <p className="mb-3 truncate text-xs text-muted-foreground">{session?.role}</p>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-2 text-muted-foreground"
          onClick={() => {
            signOut();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="size-4" />
          {!compact && "Sign out"}
        </Button>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 lg:block",
          compact ? "w-[76px]" : "w-[248px]",
        )}
      >
        <SidebarBody compact={compact} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[262px] bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setCompact((c) => !c)}
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className={cn("size-5 transition-transform", compact && "rotate-180")} />
          </Button>

          <div className="relative hidden max-w-xs flex-1 md:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search orders, products…" className="h-9 bg-background/60 pl-9" />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold md:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
