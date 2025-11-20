"use client"
import { useActionState, useEffect, useState, useRef } from "react";
import { getCartItems, checkoutAction, CheckoutState, getAddresses } from "./actions"
import { Button } from "@/components/ui/button";

type CartItemWithProduct = {
  product: {
    name: string;
    id: number;
    description: string;
    category: string;
    pricePerUnit: number;
    weightPerUnit: number;
    quantityOnHand: number;
    imageUrl: string | null;
  } | null;
  quantity: number;
};
type DeliveryAddress = {
  id: number;
  address: string;
  userId: string;
};

type CheckoutClientProps = {
  initialCartItems: CartItemWithProduct[];
  initialAddresses: DeliveryAddress[];
};
export default function CheckoutComponent({initialCartItems, initialAddresses}: CheckoutClientProps) {
  const [checkoutState, checkoutFormAction, checkoutPending] = useActionState(
    checkoutAction,
    {} as CheckoutState
  );
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>(initialCartItems); // cart data retrieved from database
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set()); // set of indices that are selected
  const [quantities, setQuantities] = useState<Record<number, number>>(
    initialCartItems.reduce((acc, item, idx) => {
      acc[idx] = item.quantity;
      return acc;
    }, {} as Record<number, number>)
  );
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    initialAddresses[0]?.id || null
  );
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleItemSelection = (idx: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(idx);
    } else {
      newSelected.delete(idx);
    }
    setSelectedItems(newSelected); //updating the setSelectedItems state
  }

  // Select ALL Functions
  const handleSelectAll = () => {
    const allIndices = cartItems
      .map((_, idx) => idx)
      .filter(idx => cartItems[idx].product !== null);
    setSelectedItems(new Set(allIndices));
  }

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  }

   const allSelected = cartItems.length > 0 && 
    cartItems.filter(item => item.product !== null).every((_, idx) => selectedItems.has(idx));

  const selectedItemsData = cartItems.map((item, idx) => (
    {
      ...item, idx, quantity: item.quantity || 0
    }
  )).filter((item, idx) => selectedItems.has(idx) && item.quantity > 0);

  // calculate only the selected items price and weighht

  const handleQuantityChange = (change: number, idx: number) => {
    setQuantities(prev => ({
      ...prev,
      [idx]: Math.max(0, prev[idx] + change)
    }));
    console.log(quantities)
  }

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    setIsAddressDropdownOpen(false);
  }

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAddressDropdownOpen(false);
      }
    };

    if (isAddressDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddressDropdownOpen]);
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form action={checkoutFormAction} className="p-6">
          <input
            type="hidden"
            name="selectedItems"
            value={JSON.stringify(
              selectedItemsData.map((item) => ({
                productId: item.product?.id,
                quantity: quantities[item.idx],
                pricePerUnit: Number(item.product?.pricePerUnit ?? 0),
                weightPerUnit: Number(item.product?.weightPerUnit ?? 0),
              }))
            )}
          />
          
          {/* Select All button */}
          {cartItems.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={allSelected ? handleDeselectAll : handleSelectAll}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedItems.size} of {cartItems.filter(item => item.product !== null).length} selected
                </span>
              </div>
            </div>
          )}

          <input
            type="hidden"
            name="selectedAddressId"
            value={selectedAddressId || ""}
          />
          <div className="space-y-4">
            {cartItems.map(
              (
                item: {
                  product: {
                    name: string;
                    id: number;
                    description: string;
                    category: string;
                    pricePerUnit: any;
                    weightPerUnit: any;
                    quantityOnHand: number;
                    imageUrl: string | null;
                  } | null;
                  quantity: number;
                },
                idx: number
              ) =>
                item.product ? (
                  <div
                    key={idx}
                    className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(idx)}
                      onChange={(e) =>
                        handleItemSelection(idx, e.target.checked)
                      }
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-4"
                    />

                    {/* Product Image */}
                    <div className="flex-shrink-0 mr-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.product.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-600">
                        <span className="font-medium text-green-600">
                          $
                          {item.product.pricePerUnit?.toNumber
                            ? item.product.pricePerUnit.toNumber().toFixed(2)
                            : item.product.pricePerUnit}
                        </span>
                        <span>
                          Weight:{" "}
                          {item.product.weightPerUnit?.toNumber
                            ? item.product.weightPerUnit.toNumber()
                            : item.product.weightPerUnit}
                          g
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.product.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1, idx)}
                        className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">
                        {quantities[idx]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1, idx)}
                        className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : null
            )}
          </div>

          {/* Delivery Address Section */}
          {cartItems.length > 0 && addresses.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Delivery Address
              </h2>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() =>
                    setIsAddressDropdownOpen(!isAddressDropdownOpen)
                  }
                  className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedAddress
                        ? selectedAddress.address
                        : "Select delivery address"}
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isAddressDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isAddressDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => handleAddressSelect(address.id)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center ${
                          selectedAddressId === address.id
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : ""
                        }`}
                      >
                        <svg
                          className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <div className="text-sm font-medium text-gray-900 flex-1 min-w-0">
                          {address.address}
                        </div>
                      </div>
                    ))}

                    {/* Add new address option */}
                    <div className="border-t border-gray-200">
                      <a
                        href="/account/addresses"
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <svg
                          className="w-5 h-5 mr-3 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <div className="text-sm font-medium flex-1 min-w-0">
                          Add new address
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  Total Items:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {selectedItemsData.reduce(
                    (total, item) => total + quantities[item.idx],
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  Total Weight:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {selectedItemsData
                    .reduce((total, item) => {
                      const weight = item?.product?.weightPerUnit
                        ? Number(item.product.weightPerUnit)
                        : 0;
                      const quantity = quantities[item.idx] || 0;
                      return total + weight * quantity;
                    }, 0)
                    .toFixed(2)}{" "}
                  lbs
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  Total Cost:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ${" "}
                  {selectedItemsData
                    .reduce((total, item, idx) => {
                      const cost = item?.product?.pricePerUnit
                        ? Number(item.product.pricePerUnit)
                        : 0;
                      const quantity = quantities[item.idx] || 0;
                      return total + cost * quantity;
                    }, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => window.location.href = '/home'}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                >Continue Shopping
                </button>
                <button
                  type="submit"
                  disabled={checkoutPending || selectedItems.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-semibold disabled:opacity-50"
                >
                  {checkoutPending
                    ? "Processing..."
                    : `Buy ${selectedItems.size} Item(s)`}
                </button>
              </div>
            </div>
          )}
          {cartItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-600">Add some items to get started!</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}