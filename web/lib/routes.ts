export const LOGIN_ROUTE = "/login";
export const SIGN_UP_ROUTE = "/sign-up";
export const DASHBOARD_ROUTE = "/dashboard";
export const ONBOARDING_ROUTE = "/onboarding";

const AUTH_ROUTES = [LOGIN_ROUTE, SIGN_UP_ROUTE] as const;

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function matchesRoute(pathname: string, route: string): boolean {
  const normalizedPath = normalizePathname(pathname);
  return normalizedPath === route || normalizedPath.startsWith(`${route}/`);
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => matchesRoute(pathname, route));
}

