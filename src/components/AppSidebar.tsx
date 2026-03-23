import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  ScrollText,
  User,
  LogOut,
  Shield,
} from "lucide-react";

const navItems = [
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/dashboard", label: "Usage & Cost", icon: LayoutDashboard },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
];

const bottomItems = [
  { to: "/profile", label: "Profile", icon: User },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar-gradient flex h-screen w-64 flex-col border-r border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-accent-foreground">Power Scribe</h1>
          <p className="text-[11px] text-sidebar-muted">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 border-t border-sidebar-border pt-2.5">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">Account</p>

        {/* Platform Admin badge */}
        <div className="mb-1 rounded-lg bg-sidebar-accent/30 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary/20">
              <Shield className="h-3 w-3 text-sidebar-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-tight text-sidebar-accent-foreground">Platform Admin</p>
              <p className="truncate text-[10px] text-sidebar-muted">admin@powerscribe.io</p>
            </div>
          </div>
        </div>

        {bottomItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          );
        })}
        <button
          onClick={() => window.location.href = "/login"}
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
