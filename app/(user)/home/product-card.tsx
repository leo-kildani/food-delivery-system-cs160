"use client";

import { Button } from "@/components/ui/button";
import { addToCartAction, SerializedProduct, AddToCartState } from "./actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProductCardProps {
  product: SerializedProduct;
  isInCart: boolean;
  quantity: number | undefined; // if product is not already in cart that number will not be displayed
  cartId: number;
  onCartChange?: () => void;
}

export function ProductCard({
  product,
  isInCart,
  quantity,
  cartId,
  onCartChange,
}: ProductCardProps) {
  const router = useRouter();
  const [q, setQuantity] = useState(quantity ? quantity : 1);
  const [quantityChanged, setQuantityChanged] = useState(false);
  const handleQuantityChange = (e: { target: { value: string } }) => {
    setQuantity(parseInt(e.target.value) || 1);
    setQuantityChanged(true);
  };
  const [state, formAction, isPending] = useActionState(
    async (prevState: AddToCartState, formData: FormData) => {
      const newState = await addToCartAction(prevState, formData);
      if (newState.success) {
        setQuantityChanged(false);
        // Trigger cart refresh callback
        if (onCartChange) {
          onCartChange();
        }
      }
      return newState;
    },
    {} as AddToCartState
  );

  return (
    <Card className="border-black/10 hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="relative w-full aspect-[3/2] bg-gray-100 overflow-hidden rounded-md">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              // Keep cover; align to center (or tweak with object-center/top/etc.)
              className="object-cover"
              // Tailor these to your breakpoints/columns
              sizes="
              (max-width: 640px) 100vw,
              (max-width: 1024px) 50vw,
              33vw"
              quality={86}
              // Optional UX niceties:
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMycgaGVpZ2h0PScyJy8+" // tiny fake blur (replace with LQIP if you have one)
              // Use priority on LCP images only (e.g., hero or first card above the fold)
              priority={false}
            />
          ) : (
            /* fallback ... */
            <div className="flex items-center justify-center h-full text-gray-400">
              No image
            </div>
          )}
        </div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold leading-tight flex-1">
            {product.name}
          </h2>
        </div>
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full w-fit">
          {product.category}
        </span>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Price per Unit</p>
              <p className="text-lg font-bold text-green-600">
                ${product.pricePerUnit.toFixed(2)}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Weight per Unit</p>
              <p className="text-lg font-bold text-blue-600">
                {product.weightPerUnit.toFixed(3)} lbs
              </p>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Available</p>
            <p className="text-lg font-bold text-orange-600">
              {product.quantityOnHand} in stock
            </p>
          </div>
          <form action={formAction}>
            {/* Hidden input */}
            <input type="hidden" name="cartId" value={cartId} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value={q} />
            <div className="flex items-end justify-center gap-8">
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Quantity
                </label>
                <Input
                  type="number"
                  id="quantity"
                  min={1}
                  max={product.quantityOnHand}
                  value={q}
                  onChange={handleQuantityChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-5">
                {!isInCart ? (
                  <Button type="submit">
                    {isPending ? "Adding To Cart..." : "Add To Cart"}
                  </Button>
                ) : quantityChanged ? (
                  <Button type="submit">
                    {isPending ? "Updating Cart..." : "Update Cart"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="border border-gray-300 bg-transparent text-gray-700"
                    disabled={isPending}
                    onClick={() => router.push("/shopping-cart")}
                  >
                    {isPending ? "Updating Cart..." : "In Cart"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
