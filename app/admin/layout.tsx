import Link from "next/link";
import LogoutButton from "./logout-button";
import { createClient } from "@/lib/supabase/server";
import { House } from "lucide-react";
import { requireAuthRole } from "./actions";

// Force dynamic rendering since we use cookies and database
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const SuperUser = await requireAuthRole();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userRole = data.user?.user_metadata?.role;

  return (
    <div>
      <nav className="bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-lg border-b border-cyan-500">
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
                <span className="text-sm text-cyan-100 font-medium">
                  Online Food System - Admin View
                </span>
              </div>
            </div>

            {/* Right Section - Navigation & Actions */}
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/analytics/"
                className="text-white hover:text-cyan-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Analytics
              </Link>
              <Link
                href="/admin/inventory/"
                className="text-white hover:text-cyan-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Inventory
              </Link>
              {userRole === "admin" && (
                <Link
                  href="/admin/employees/"
                  className="text-white hover:text-cyan-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
                >
                  Employees
                </Link>
              )}
              <Link
                href="/admin/vehicles/"
                className="text-white hover:text-cyan-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Vehicles
              </Link>
              <Link
                href="/admin/orders/"
                className="text-white hover:text-cyan-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Orders
              </Link>
              <div className="pr-9">
                <Link
                  href="/home"
                  className="text-slate-300 hover:text-cyan-100 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-white/10"
                >
                  <House className="inline-block mr-1 mb-1" size={19} />
                  <span className="text-sm font-medium">Home</span>
                </Link>
              </div>
              <LogoutButton></LogoutButton>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
