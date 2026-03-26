import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Freedom Landscapes
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            Freedom App 2.0
          </h1>
        </div>
        {children}
      </div>
    </main>
  );
}

