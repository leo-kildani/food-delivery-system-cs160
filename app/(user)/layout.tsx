import Link from "next/link";
import LogoutButton from "./logout-button";
import ShoppingCartButton from "./shopping-cart-button";
import { getLoggedInUser } from "./actions";
import { getCartItems } from "./checkout/actions";

// Force dynamic rendering since we use cookies and database
export const dynamic = 'force-dynamic';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getLoggedInUser();
  // Guest users (not logged in) can only access the home page
  const isGuest = !user;

  //Shopping Cart Item Count in Corner
  let cartItemCount = 0;
  // Only fetch cart items if the user is logged in
  if (!isGuest) {
    const cartItems = getCartItems();
    cartItemCount = (await cartItems).length;
  }

  return (
    <div>
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b border-blue-500">
        <div className="max-w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-white tracking-wide">
                  OFS
                </span>
              </div>
              <div className="hidden md:block">
                <span className="text-sm text-blue-100 font-medium">
                  Online Food System
                </span>
              </div>
            </div>

            {/* Right Section - Navigation & Actions */}
            <div className="flex items-center space-x-3">
              {/* Home link - always enabled for all users */}
              <Link
                href="/home"
                className="text-white hover:text-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Home
              </Link>

              {/* Account link - only clickable for logged-in users */}
              {isGuest ? (
                <span className="text-blue-300/50 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                  Account
                </span>
              ) : (
                <Link
                  href="/account/details"
                  className="text-white hover:text-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
                >
                  Account
                </Link>
              )}

              {/* Admin link - only shown for admin users */}
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin/analytics"
                  className="text-white hover:text-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
                >
                  Admin
                </Link>
              )}

              <div className="pr-9">
                {/* Shopping cart - always shown but disabled for guest users */}
                <ShoppingCartButton count={cartItemCount} disabled={isGuest} />
              </div>

              {/* Logout - only shown for logged-in users */}
              {!isGuest && <LogoutButton />}

              {/* Login/Signup buttons - only shown for guest users */}
              {isGuest && (
                <Link
                  href="/login"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
