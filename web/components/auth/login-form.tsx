"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { initialAuthActionState } from "@/app/(auth)/auth-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialAuthActionState,
  );

  return (
    <Card className="w-full max-w-md p-6">
      <CardHeader className="mb-2 px-0">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to access your dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form action={formAction} className="space-y-4">
          <Input
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            required
          />
          <Input
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            required
          />
          {state.error ? (
            <p className="auth-feedback-error">{state.error}</p>
          ) : null}
          <Button type="submit" className="w-full" loading={pending}>
            Sign In
          </Button>
        </form>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Need an account?{" "}
          <Link href="/sign-up" className="font-semibold text-[var(--brand-primary)]">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

