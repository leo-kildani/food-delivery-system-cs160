"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ShoppingCartButtonProps = {
  count?: number;
  className?: string;
};

export default function ShoppingCartButton({
  count = 0,
  className,
}: ShoppingCartButtonProps) {
  return (
    <div className={`relative inline-flex ${className ?? ""}`}>
      <Button
        asChild
        variant="ghost"
        className="flex items-center gap-2 pr-3"
      >
        <Link href="/shopping-cartv1" aria-label="Go to shopping cart">
          <Image
            src="/shopping-cart.svg"
            alt="Shopping cart icon"
            width={22}
            height={22}
          />
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