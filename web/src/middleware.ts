import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // app.bair1.live → serve /dashboard as the root
  if (host.startsWith("app.")) {
    // If they hit app.bair1.live/ → rewrite to /dashboard
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/dashboard", request.url));
    }
    // If they hit app.bair1.live/dashboard → keep as-is (no redirect loop)
    // All other routes on app subdomain pass through normally
  }

  // bair1.live/dashboard → redirect to app.bair1.live
  if (!host.startsWith("app.") && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect("https://app.bair1.live");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|bear-logo\\.png|bear-logo\\.jpg|icons\\.svg).*)"],
};
