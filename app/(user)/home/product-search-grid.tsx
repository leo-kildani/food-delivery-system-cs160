"use client";

import { useMemo, useState } from "react";
import { CartItem, SerializedProduct } from "./actions";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";
import { ProductCard } from "./product-card";
import { useSetSearchParam } from "@/hooks/use-set-search-param";
import { useSearchParams } from "next/navigation";

interface ProductSearchProps {
  products: SerializedProduct[];
  cart: CartItem[];
  cartId: number;
}

const PAGE_SIZE = 9;

export default function ProductSearchGrid({
  products,
  cart,
  cartId,
}: ProductSearchProps) {
  const [userQuery, setUserQuery] = useState("");
  const [debounced] = useDebounce(userQuery, 250);

  const searchParams = useSearchParams();
  const setSearch = useSetSearchParam();

  // check if a certain product is already in cart and keep a list of that
  let cartItemMap: Map<number, number> = new Map();

  cart.forEach((cartItem) => {
    cartItemMap.set(cartItem.product.id, cartItem.quantity);
  });

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
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = raw.slice(start, start + PAGE_SIZE);

  // --- page setter using setSearchParam hook ---
  const setPage = (nextPage: number, { replace = false } = {}) => {
    setSearch(
      (sp) => {
        if (nextPage <= 1) sp.delete("page");
        else sp.set("page", String(nextPage));
      },
      { replace }
    );
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
            cartId={cartId}
          />
        ))}
      </div>

      {/* Simple pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-4">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
