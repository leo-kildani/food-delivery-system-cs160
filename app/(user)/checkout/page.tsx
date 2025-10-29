import { getCartItems, getAddresses } from "./actions"
import CheckoutComponent from "./checkoutItems"

export default async function UserCheckout() {
  const cartItems = await getCartItems();
  const addresses = await getAddresses();
  
  return <CheckoutComponent initialCartItems={cartItems} initialAddresses={addresses} />;
}