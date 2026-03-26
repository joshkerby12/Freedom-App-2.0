import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DASHBOARD_ROUTE,
  isAuthRoute,
  LOGIN_ROUTE,
  normalizePathname,
  ONBOARDING_ROUTE,
} from "@/lib/routes";
import { getSessionSnapshot } from "@/lib/supabase/middleware";

function redirectTo(request: NextRequest, destination: string) {
  return NextResponse.redirect(new URL(destination, request.url));
}

export async function middleware(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const authPath = isAuthRoute(pathname);
  const onboardingPath = pathname === ONBOARDING_ROUTE;
  const rootPath = pathname === "/";

  let snapshot;
  try {
    snapshot = await getSessionSnapshot(request);
  } catch {
    return authPath ? NextResponse.next() : redirectTo(request, LOGIN_ROUTE);
  }

  if (!snapshot.user) {
    return authPath ? snapshot.response : redirectTo(request, LOGIN_ROUTE);
  }

  if (!snapshot.hasOrg) {
    return onboardingPath ? snapshot.response : redirectTo(request, ONBOARDING_ROUTE);
  }

  if (authPath || onboardingPath || rootPath) {
    return redirectTo(request, DASHBOARD_ROUTE);
  }

  return snapshot.response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

