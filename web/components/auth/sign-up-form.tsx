"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "@/app/(auth)/actions";
import { initialAuthActionState } from "@/app/(auth)/auth-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialAuthActionState,
  );

  return (
    <Card className="w-full max-w-md p-6">
      <CardHeader className="mb-2 px-0">
        <CardTitle>Create account</CardTitle>
        <CardDescription>Set up your Ground Control Pro access.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form action={formAction} className="space-y-4">
          <Input
            name="fullName"
            type="text"
            label="Full name"
            autoComplete="name"
          />
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
            helperText="Use at least 8 characters."
            autoComplete="new-password"
            required
          />
          {state.error ? (
            <p className="auth-feedback-error">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="auth-feedback-success">{state.success}</p>
          ) : null}
          <Button type="submit" className="w-full" loading={pending}>
            Sign Up
          </Button>
        </form>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand-primary)]">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

