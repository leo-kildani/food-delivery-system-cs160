import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "./lib/supabase/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const supabase = await createClient();

  const adminRoutes = ["/admin"];

  const { pathname } = request.nextUrl;

  const { data } = await supabase.auth.getUser();

  const userMetadata = data.user?.user_metadata;

  if (
    adminRoutes.some(
      (route) => pathname.startsWith(route) && userMetadata?.role !== "admin"
    )
  ) {
    // TODO: create error page
    return NextResponse.redirect(new URL("/login", request.url));
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
