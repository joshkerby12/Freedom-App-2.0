"use server";

import { redirect } from "next/navigation";
import { acceptInvite } from "@/lib/employees/invite-service";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function acceptInviteAction(formData: FormData): Promise<void> {
  const token = readText(formData, "token");
  const password = readText(formData, "password");
  const confirmPassword = readText(formData, "confirmPassword");
  const returnPath = readText(formData, "returnPath") || `/invite/accept?token=${encodeURIComponent(token)}`;

  try {
    if (!token) {
      throw new Error("Missing invite token.");
    }

    if (!password) {
      throw new Error("Password is required.");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    await acceptInvite(token, password);
    redirect("/dashboard");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to accept invite.";
    const separator = returnPath.includes("?") ? "&" : "?";
    redirect(`${returnPath}${separator}error=${encodeURIComponent(message)}`);
  }
}
