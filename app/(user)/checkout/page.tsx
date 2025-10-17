"use server"
import { getCartItems } from "./actions"


export default async function UserCheckout() {
  let ans = await getCartItems();
  console.log(ans)
  return (
    <div>
      <form>
        <div>
          {ans.map(
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
                <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                  <input type="checkbox" style={{ marginRight: "1rem" }} />
                  <div style={{ flex: 1 }}>
                    <div><strong>{item.product.name}</strong></div>
                    <div>Price: ${item.product.pricePerUnit?.toNumber ? item.product.pricePerUnit.toNumber().toFixed(2) : item.product.pricePerUnit}</div>
                    <div>Weight: {item.product.weightPerUnit?.toNumber ? item.product.weightPerUnit.toNumber() : item.product.weightPerUnit}g</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button type="button" style={{ marginRight: "0.5rem" }}>-</button>
                    <span>{item.quantity}</span>
                    <button type="button" style={{ marginLeft: "0.5rem" }}>+</button>
                  </div>
                </div>
              ) : null
          )}
        </div>
      </form>
    </div>
  )
}