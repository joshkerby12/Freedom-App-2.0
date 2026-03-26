import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

type SessionSnapshot = {
  response: NextResponse;
  user: User | null;
  hasOrg: boolean;
};

export async function getSessionSnapshot(
  request: NextRequest,
): Promise<SessionSnapshot> {
  let response = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response, user: null, hasOrg: false };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  // membershipError here is typically the self-referential RLS recursion on
  // org_members — treat any error as "no org found" so the user stays blocked.
  const hasOrg = !membershipError && Boolean(membership?.org_id);

  return { response, user, hasOrg };
}

