import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "./lib/supabase/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const supabase = await createClient();

  const adminRoutes = ["/admin"];
  const employeeRoutes = ["/admin/inventory"];
  const adminOnlyRoutes = ["/admin/employees"];
  const orderRoutes = ["/admin/orders"];

  const { pathname } = request.nextUrl;

  const { data } = await supabase.auth.getUser();

  const userMetadata = data.user?.user_metadata;

  // Check employee routes FIRST (ADMIN and EMPL can access)
  if (employeeRoutes.some((route) => pathname.startsWith(route))) {
    if (userMetadata?.role !== "admin" && userMetadata?.role !== "empl") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response; // Allow access if user is admin or empl
  }

  // Check admin-only routes (only ADMIN can access)
  if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (userMetadata?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Check order routes (only ADMIN can access)
  if (orderRoutes.some((route) => pathname.startsWith(route))) {
    if (userMetadata?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Check general admin routes (only ADMIN can access)
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (userMetadata?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
