"use client";

import { startTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * A reusable hook for updating search params in the URL
 * (optionally using replace to avoid cluttering browser history).
 */
export function useSetSearchParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (updater: (sp: URLSearchParams) => void, { replace = true } = {}) => {
    const sp = new URLSearchParams(searchParams.toString());
    updater(sp);
    const href = sp.toString() ? `${pathname}?${sp}` : pathname;

    startTransition(() => {
      replace ? router.replace(href) : router.push(href);
    });
  };
}
