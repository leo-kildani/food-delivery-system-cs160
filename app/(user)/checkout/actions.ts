'use server';

import prisma from '@/lib/prisma';
import {createClient} from '@/lib/supabase/server';
import {DeliveryAddress, Prisma, Product, Order} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Define query type for Cart with Cartitem and products
const cartWithItemsAndProduct = Prisma.validator<Prisma.CartDefaultArgs>()({
  include: {
    cartItems: {
      include: {
        product: true,
      },
    },
  },
});

// Define query return type for type checking (TS)
export type CartWithItemsAndProduct =
    Prisma.CartGetPayload<typeof cartWithItemsAndProduct>;

async function getUserId() {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  let personal_user = await prisma.user.findUnique({
    where: {authId: user?.id},
  });
  if (!personal_user?.id) {
    throw new Error('User not found or user ID is undefined');
  }
  return personal_user.id;
}
export async function getCartItems() {
  // first get userId
  // get cart id from userId from the cart table
  // return all cartItems with a certain cartID
  let userId = await getUserId();
  let cartId = await prisma.cart.findUnique({where: {userId: userId}});
  if (cartId == null) {
    return [];
  }
  let cart = await prisma.cart.findUnique({
    where: {
      userId: userId,
    },
    ...cartWithItemsAndProduct,
  });
  if (!cart) {
    return [];
  }
  let toReturn = cart?.cartItems.map(
      (item) => {return ({
        ...item,
        product: {
          ...item.product,
          pricePerUnit: item.product.pricePerUnit.toNumber(),
          weightPerUnit: item.product.weightPerUnit.toNumber()
        }
      })})

  return toReturn;
}

export type CheckoutState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function getAddresses(): Promise<DeliveryAddress[]> {
  let userId = await getUserId();
  let addresses = await prisma.deliveryAddress.findMany({
    where: {
      userId: userId,
    }
  }
  )
  return addresses;
}

export async function checkoutAction(
    prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  try {
    const selectedItemsJson = formData.get('selectedItems') as string;
    const selectedItems = JSON.parse(selectedItemsJson);
    const selectedAddressId = formData.get('selectedAddressId') as string;

    let userId = await getUserId();
    let cart = await prisma.cart.findUnique({ where: { userId: userId } });
    let addresses = await getAddresses();
    if (addresses.length <= 0) {
      return { formError: "You do not have an address set" };
    }
    
    const selectedAddress = addresses.find(addr => addr.id === parseInt(selectedAddressId));
    if (!selectedAddress) {
      return { formError: "Please select a valid delivery address" };
    }
    // Server-side validation: re-fetch products, verify stock and recompute weight/prices
    const productIds = selectedItems.map((item: any) => item.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap: Record<number, Product> = {};
    products.forEach((p) => (productMap[p.id] = p));

    // Recompute totals from DB values (do not trust client values)
    let totalWeight = 0;
    let itemsTotal = 0;
    for (const it of selectedItems) {
      const prod = productMap[it.productId];
      if (!prod) {
        return { formError: `Product ${it.productId} not found` };
      }
      const qty = Number(it.quantity) || 0;
      if (qty <= 0) {
        return { formError: `Invalid quantity for product ${it.productId}` };
      }
      if (prod.quantityOnHand < qty) {
        return { formError: `Not enough stock for ${prod.name}. Available: ${prod.quantityOnHand}` };
      }
      const weightPer = prod.weightPerUnit.toNumber();
      const pricePer = prod.pricePerUnit.toNumber();
      totalWeight += weightPer * qty;
      itemsTotal += pricePer * qty;
    }

    // Enforce total weight limit
    if (totalWeight > 200) {
      return { formError: 'Order exceeds maximum allowed weight of 200 lbs' };
    }

    const additionalFee = totalWeight > 20 ? 10 : 0;

    // Create order and order items in a transaction, decrement stock, and remove cart items
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: userId,
          status: 'PENDING',
          toAddress: selectedAddress.address,
          createdAt: new Date(),
        },
      });

      // create order items using DB-verified prices/weights
      const orderItemsData = selectedItems.map((it: any) => {
        const prod = productMap[it.productId];
        const qty = Number(it.quantity) || 0;
        return {
          orderId: order.id,
          productId: prod.id,
          quantity: qty,
          pricePerUnit: prod.pricePerUnit.toNumber(),
          weightPerUnit: prod.weightPerUnit.toNumber(),
        };
      });

      await tx.orderItem.createMany({ data: orderItemsData });

      // decrement product stock
      for (const it of selectedItems) {
        await tx.product.update({
          where: { id: it.productId },
          data: { quantityOnHand: { decrement: Number(it.quantity) } },
        });
      }

      // remove items from cart
      await tx.cartItem.deleteMany({ where: { cartId: cart?.id, productId: { in: productIds } } });
    });

  } catch (error) {
    console.log('some error:', error);
    return {formError: 'Checkout failed, some problem occured'};
  }
  revalidatePath('/home');
  redirect('/home')
}
