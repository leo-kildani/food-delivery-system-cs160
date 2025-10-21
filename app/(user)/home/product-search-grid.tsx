"use client";

import { useMemo, useState } from "react";
import { CartItem, SerializedProduct } from "./actions";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";
import { ProductCard } from "./product-card";

interface ProductSearchProps {
  products: SerializedProduct[];
  cart: CartItem[];
}

export default function ProductSearchGrid({ products , cart}: ProductSearchProps) {
  const [userQuery, setUserQuery] = useState("");
  const [debounced] = useDebounce(userQuery, 500);
  // check if a certain product is already in cart and keep a list of that
  let cartItemMap: Map<number, number> = new Map();
  let cartId = -1
  if (cart.length > 0) {
    cartId = cart[0].cartId;
  }
  cart.forEach((cartItem) => {
    cartItemMap.set(cartItem.product.id, cartItem.quantity);
  })
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
  const raw = debounced
    ? fuse
        .search(debounced)
        .slice(0, 10)
        .map((p) => p.item)
    : products;

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="product-search" className="block text-sm font-medium">
          Search
        </label>
        <input
          id="product-search"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="Search products…"
          className="mt-1 w-full rounded border px-3 py-2"
          aria-label="Search products"
        />
      </div>

      {debounced && raw.length === 0 && (
        <p className="text-sm text-gray-500">No results for “{debounced}”.</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {raw.map((product) => (
          <ProductCard key={product.id} product={product} isInCart={cartItemMap.has(product.id)} quantity = {cartItemMap.get(product.id)} cartId={cartId}  />
        ))}
      </div>
    </div>
  );
}
