import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { User, MapPin, Package } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-3 rounded-2xl border border-black/10 shadow-sm h-fit md:sticky md:top-8">
            <nav className="p-4">
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
          </aside>

          {/* Main content */}
          <main className="md:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  const base =
    "flex items-center gap-3 rounded-xl px-3 py-2 font-medium border border-transparent hover:border-black/20 hover:bg-black/5 transition";
  return (
    <Link href={href} className={cn(base)}>
      <span className="grid place-items-center" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
