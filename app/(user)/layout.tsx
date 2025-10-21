import Link from "next/link";
import LogoutButton from "./logout-button";
import ShoppingCartButton from "./shopping-cart-button";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link
                href="/home"
                className="text-white hover:text-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Home
              </Link>
              <Link
                href="/account/details"
                className="text-white hover:text-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Account
              </Link>
              <ShoppingCartButton></ShoppingCartButton>
              <LogoutButton></LogoutButton>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
