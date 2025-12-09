import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/error") &&
    !request.nextUrl.pathname.startsWith("/home")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // --- ROLE-BASED ACCESS CONTROL FOR /admin ---
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // however you're storing it: adjust this line to match your setup
    const role =
      // common patterns – pick the one that matches your Supabase setup
      // e.g. user.user_metadata.role = "ADMIN" | "EMPLOYEE"
      (user as any)?.user_metadata?.role ??
      (user as any)?.app_metadata?.role ??
      (user as any)?.role;

    // If somehow no role, treat as unauthorized
    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = "/home"; // or "/error" or "/login"
      const redirectResponse = NextResponse.redirect(url);
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      }
      return redirectResponse;
    }

    // EMPLOYEE restrictions:
    // - block /admin/employees
    // - block /admin/orders
    if (role === "EMPL") {
      const isEmployeesPage =
        request.nextUrl.pathname.startsWith("/admin/employees");
      const isOrdersPage = request.nextUrl.pathname.startsWith("/admin/orders");

      if (isEmployeesPage || isOrdersPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/home"; // or some "not authorized" page
        const redirectResponse = NextResponse.redirect(url);
        for (const cookie of supabaseResponse.cookies.getAll()) {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        }
        return redirectResponse;
      }
    }

    // If role is ADMIN, we let them through to any /admin route
    // If role is something else, you can also block them:
    if (role !== "ADMIN" && role !== "EMPL") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      const redirectResponse = NextResponse.redirect(url);
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      }
      return redirectResponse;
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
