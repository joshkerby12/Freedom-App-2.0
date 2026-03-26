"use server";

import { redirect } from "next/navigation";
import { DASHBOARD_ROUTE } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "./auth-types";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readField(formData, "email");
  const password = readField(formData, "password");

  if (!email || !password) {
    return {
      error: "Email and password are required.",
      success: null,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  redirect(DASHBOARD_ROUTE);
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = readField(formData, "fullName");
  const email = readField(formData, "email");
  const password = readField(formData, "password");

  if (!email || !password) {
    return {
      error: "Email and password are required.",
      success: null,
    };
  }

  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters long.",
      success: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  if (data.session) {
    redirect(DASHBOARD_ROUTE);
  }

  return {
    error: null,
    success: "Account created. Check your email to confirm, then sign in.",
  };
}
