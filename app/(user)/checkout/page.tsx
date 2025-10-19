import { getCartItems } from "./actions"
import CheckoutComponent from "./checkoutItems"

export default async function UserCheckout() {
  const cartItems = await getCartItems();
  
  return <CheckoutComponent initialCartItems={cartItems} />;
}