import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: ReactNode;
  onSignOut: () => Promise<void>;
};

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", abbr: "DB" },
  { href: "/clients", label: "Clients", abbr: "CL" },
  { href: "/employees", label: "Employees", abbr: "EM" },
  { href: "/crews", label: "Crews", abbr: "CR" },
  { href: "/fleet/equipment", label: "Fleet", abbr: "FL" },
];

export function AppShell({ children, onSignOut }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-shell-sidebar">
        <div className="app-shell-sidebar-title">Freedom App</div>
        <nav className="app-shell-sidebar-nav">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} className="app-shell-link">
              <span className="app-shell-link-abbr">{item.abbr}</span>
              <span className="app-shell-link-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <header className="app-shell-top">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Freedom Landscapes
          </p>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Operations Dashboard
          </h1>
        </div>
        <form action={onSignOut}>
          <Button variant="secondary" type="submit">
            Sign Out
          </Button>
        </form>
      </header>

      <nav className="app-shell-mobile-nav">
        {navigationItems.map((item) => (
          <Link key={`mobile-${item.href}`} href={item.href} className="app-shell-mobile-link">
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="app-shell-main">{children}</main>
    </div>
  );
}
