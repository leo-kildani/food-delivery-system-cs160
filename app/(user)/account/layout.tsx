import { ReactNode } from "react";
import { User, MapPin, Package } from "lucide-react";
import { NavItem } from "./nav-item";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="rounded-xl border border-black/10 bg-white shadow-sm p-4 md:sticky md:top-8">
              <nav>
                <ul className="space-y-1">
                  <li>
                    <NavItem
                      href="/account/details"
                      icon={<User className="h-4 w-4" />}
                      label="Account details"
                    />
                  </li>
                  <li>
                    <NavItem
                      href="/account/addresses"
                      icon={<MapPin className="h-4 w-4" />}
                      label="Delivery addresses"
                    />
                  </li>
                  <li>
                    <NavItem
                      href="/account/orders"
                      icon={<Package className="h-4 w-4" />}
                      label="Orders"
                    />
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
