import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { signOutAction } from "@/app/(app)/actions";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell onSignOut={signOutAction}>{children}</AppShell>;
}

