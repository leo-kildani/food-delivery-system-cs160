import Link from "next/link";
import LogoutButton from "./logout-button";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-gray-900">OFS</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/home"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/checkout"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Checkout 
              </Link>
              <LogoutButton></LogoutButton>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
