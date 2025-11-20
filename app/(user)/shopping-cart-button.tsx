"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShoppingCartButtonProps = {
  count?: number;
  className?: string;
  // When disabled is true, the button appears grayed out and is not clickable (for guest users)
  disabled?: boolean;
};

export default function ShoppingCartButton({
  count = 0,
  className,
  disabled = false,
}: ShoppingCartButtonProps) {
  // If disabled (guest user), render as a non-interactive span
  if (disabled) {
    return (
      <div className={`relative inline-flex ${className ?? ""}`}>
        <span className="flex items-center gap-2 pr-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-300/50 cursor-not-allowed">
          <ShoppingCart className="inline-block mr-1" size={22} />
          <span className="font-medium">Shopping Cart</span>
        </span>
      </div>
    );
  }

  // For logged-in users, render as an interactive button
  return (
    <div className={`relative inline-flex ${className ?? ""} text-slate-300`}>
      <Button asChild variant="ghost" className="flex items-center gap-2 pr-3">
        <Link href="/shopping-cart" aria-label="Go to shopping cart">
          <ShoppingCart className="inline-block mr-1" size={22} />
          <span className="font-medium">Shopping Cart</span>
        </Link>
      </Button>

      {count > 0 && (
        <span
          aria-live="polite"
          className="pointer-events-none absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}
