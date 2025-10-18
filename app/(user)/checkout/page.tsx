"use client"
import { useActionState, useEffect, useState } from "react";
import { getCartItems, checkoutAction, CheckoutState } from "./actions"
import { Item } from "@radix-ui/react-accordion";

export default function UserCheckout() {
  // const [checkoutState, checkoutFormAction, checkoutPending] = useActionState(
  //   checkoutAction,
  //   {} as CheckoutState
  // );
  const [cartItems, setCartItems] = useState<any[]>([]); // cart data retrieved from database
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set()); // set of indices that are selected
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  // apparently we cannot use async FormAction in async functions
  useEffect(() => {
    async function loadCartItems() {
      try {
        let items = await getCartItems();
        setCartItems(items);

        // const initialQuantities = items.reduce((acc, item, idx) => {
        //   if (item.product) {
        //     acc[idx] = item.quantity;
        //   }
        //   return acc;
        // })
      } catch (error) {
        console.log("couldn't load cart items");
      } finally {
        setLoading(false)
      }
    }
    loadCartItems();
  }, []);

  const handleItemSelection = (idx: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(idx);
    } else {
      newSelected.delete(idx);
    }
    setSelectedItems(newSelected); //updating the setSelectedItems state
  }
  const selectedItemsData = cartItems.map((item, idx) => (
    {
      ...item, idx, quantity: item.quantity || 0
    }
  )).filter((item, idx) => selectedItems.has(idx) && item.quantity > 0);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>
        
        <form action={async (formData: FormData) => {
            const checkoutData = selectedItemsData.map(item => ({
              productId: item.product?.id,
              quantity: item.quantity,
              pricePerUnit: item.product?.pricePerUnit ? Number(item.product.pricePerUnit) : 0
            }));
            formData.set('selectedItems', JSON.stringify(checkoutData));
            const result = await checkoutAction(formData);
            console.log(result);
          }} className="p-6">
          {/* <input
            type="hidden"
            name="selectedItems"
            value={JSON.stringify(selectedItemsData.map(item => ({
              productId: item.product?.id,
              quantity: item.quantity,
              pricePerUnit: Number(item.product?.pricePerUnit ?? 0)
            })))}
          /> */}
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
                  <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.has(idx)}
                      onChange={(e)=>handleItemSelection(idx, e.target.checked)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-4" 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-600">
                        <span className="font-medium text-green-600">
                          ${item.product.pricePerUnit?.toNumber ? item.product.pricePerUnit.toNumber().toFixed(2) : item.product.pricePerUnit}
                        </span>
                        <span>
                          Weight: {item.product.weightPerUnit?.toNumber ? item.product.weightPerUnit.toNumber() : item.product.weightPerUnit}g
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.product.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <button 
                        type="button" 
                        className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                      <button 
                        type="button" 
                        className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : null
            )}
          </div> 
          {cartItems.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total Items:</span>
                <span className="text-lg font-bold text-gray-900">
                  {cartItems.reduce((total, item) => total + item.quantity, 0)}
                </span>
              </div>
             <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total Weight:</span>
                <span className="text-lg font-bold text-gray-900">
                  {cartItems.reduce((total, item) => {
                    const weight = item?.product?.weightPerUnit ? Number(item.product.weightPerUnit) : 0;
                    const quantity = item.quantity || 0;
                    return total + (weight * quantity);
                  }, 0).toFixed(2)} lbs
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total Cost:</span>
                <span className="text-lg font-bold text-gray-900">
                  $ {cartItems.reduce((total, item) => {
                    const cost = item?.product?.pricePerUnit ? Number(item.product.pricePerUnit) : 0;
                    const quantity = item.quantity || 0;
                    return total + (cost * quantity);
                  }, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  type="button" 
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  Continue Shopping
                </button>
                {/* <button 
                  onClick={handleCheckout}
                  disabled={checkoutPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-semibold disabled:opacity-50"
                >
                  Save Selection
                </button> */}
                <button 
                  type="submit" 
                  // disabled={checkoutPending}
                  // onClick={handleCheckout}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-semibold disabled:opacity-50"
                >
                  {/* {checkoutPending ? 'Processing...' : 'Buy'} */}
                  Buy
                </button>
              </div>
            </div>
          )}
          {cartItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600">Add some items to get started!</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}