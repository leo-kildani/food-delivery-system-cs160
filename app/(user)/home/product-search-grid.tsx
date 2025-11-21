"use client";

import { startTransition, useMemo, useState, useTransition } from "react";
import { CartItem, SerializedProduct } from "./actions";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";
import { ProductCard } from "./product-card";
import { useSetSearchParam } from "@/hooks/use-set-search-param";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface ProductSearchProps {
  products: SerializedProduct[];
  // cart and cartId will be null if user is not logged in
  cart: CartItem[] | null;
  cartId: number | null;
}

const PAGE_SIZE = 9;

export default function ProductSearchGrid({
  products,
  cart,
  cartId,
}: ProductSearchProps) {
  const [userQuery, setUserQuery] = useState("");
  const [debounced] = useDebounce(userQuery, 250);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const setSearch = useSetSearchParam();

  // Build a map of cart items (productId -> quantity)
  // If cart is null (user not logged in), the map will be empty
  let cartItemMap: Map<number, number> = new Map();

  if (cart) {
    cart.forEach((cartItem) => {
      cartItemMap.set(cartItem.product.id, cartItem.quantity);
    });
  }

  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ["name", "category"],
        threshold: 0.2,
        includeScore: true,
        includeMatches: true,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [products]
  );
  const raw = debounced ? fuse.search(debounced).map((p) => p.item) : products;

  // --- page from URL ---
  const rawPage = Number(searchParams.get("page") ?? "1");
  const requestedPage =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const totalPages = Math.max(1, Math.ceil(raw.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = raw.slice(start, start + PAGE_SIZE);

  // --- page setter using setSearchParam hook ---
  const setPage = (nextPage: number, { replace = false } = {}) => {
    startTransition(() => {
      setSearch(
        (sp) => {
          if (nextPage <= 1) sp.delete("page");
          else sp.set("page", String(nextPage));
        },
        { replace }
      );
    });
  };

  // handle product search bar
  const handleSearchChange = (q: string) => {
    setUserQuery(q);
    // keep URL accurate and reset to page 1
    setSearch(
      (sp) => {
        sp.delete("page");
      },
      { replace: true }
    );
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const delta = 1; // pages to show on each side of current

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="product-search" className="block text-sm font-medium">
          Search
        </label>
        <input
          id="product-search"
          value={userQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search products…"
          className="mt-1 w-full rounded border px-3 py-2"
          aria-label="Search products"
        />
      </div>

      {debounced && raw.length === 0 && (
        <p className="text-sm text-gray-500">No results for “{debounced}”.</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isInCart={cartItemMap.has(product.id)}
            quantity={cartItemMap.get(product.id)}
            // Pass cartId only if user is logged in (not null)
            // If null, cart functionality will be hidden in ProductCard
            cartId={cartId}
          />
        ))}
      </div>

    {/* Pagination */}
      {totalPages > 1 && (
        <nav
          role="navigation"
          aria-label="Pagination"
          className="mx-auto flex w-full justify-center mt-8"
        >
          <ul className="flex items-center gap-1">
            {/* Previous Button */}
            <li>
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                aria-label="Go to previous page"
                className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium 
                  h-9 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900
                  disabled:pointer-events-none disabled:opacity-50 
                  transition-colors duration-150 ease-in-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
            </li>

            {/* Page Numbers */}
            {getPageNumbers().map((page, idx) =>
              page === "ellipsis" ? (
                <li key={`ellipsis-${idx}`}>
                  <span className="flex h-9 w-9 items-center justify-center">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </span>
                </li>
              ) : (
                <li key={page}>
                  <button
                    onClick={() => setPage(page)}
                    disabled={isPending}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium
                      h-9 w-9 transition-colors duration-150 ease-in-out
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2
                      ${
                        currentPage === page
                          ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                          : "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900"
                      }
                      disabled:pointer-events-none disabled:opacity-50`}
                  >
                    {page}
                  </button>
                </li>
              )
            )}

            {/* Next Button */}
            <li>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                aria-label="Go to next page"
                className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium 
                  h-9 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900
                  disabled:pointer-events-none disabled:opacity-50 
                  transition-colors duration-150 ease-in-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Page indicator */}
      {totalPages > 1 && (
        <p className="text-center text-sm text-gray-500 mt-3">
          Page {currentPage} of {totalPages}
          {isPending && <span className="ml-2 animate-pulse">Loading...</span>}
        </p>
      )}
    </div>
  );
}
