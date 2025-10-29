"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SerializedProduct, CartItem } from "./actions";
import { ProductCard } from "./product-card";
import { useEffect, useState } from "react";
import { getCartItems } from "../checkout/actions";

interface SuggestedProduct {
  productID: number;
  productName: string;
  quantity: number;
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedProducts: SuggestedProduct[];
  allProducts: SerializedProduct[];
  cartId: number;
  cartItems: CartItem[];
  onCartUpdate: (items: CartItem[]) => void;
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  suggestedProducts,
  allProducts,
  cartId,
  cartItems: initialCartItems,
  onCartUpdate,
}: ProductSelectionModalProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

  // Update local cart items when prop changes
  useEffect(() => {
    setCartItems(initialCartItems);
  }, [initialCartItems]);

  // Refresh cart items when modal opens
  useEffect(() => {
    if (isOpen) {
      const refreshCart = async () => {
        const items = await getCartItems();
        setCartItems(items);
        onCartUpdate(items);
      };
      refreshCart();
    }
  }, [isOpen, onCartUpdate]);

  const handleCartChange = async () => {
    const items = await getCartItems();
    setCartItems(items);
    onCartUpdate(items);
  };

  // Match suggested products with full product data
  const matchedProducts = suggestedProducts
    .map(sp => {
      const product = allProducts.find(p => p.id === sp.productID);
      return product ? { product, suggestedQuantity: sp.quantity } : null;
    })
    .filter(Boolean) as { product: SerializedProduct; suggestedQuantity: number }[];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Suggested Ingredients</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {matchedProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No products found matching your request.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedProducts.map(({ product, suggestedQuantity }) => {
                const cartItem = cartItems.find(item => item.productId === product.id);
                const isInCart = !!cartItem;
                const currentQuantity = cartItem?.quantity || suggestedQuantity;
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isInCart={isInCart}
                    quantity={currentQuantity}
                    cartId={cartId}
                    onCartChange={handleCartChange}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}