"use server";

import prisma from "@/lib/prisma";
import { Product } from "@prisma/client";
import {createClient} from '@/lib/supabase/server';
import { getCartItems } from "../checkout/actions";
 import { revalidatePath } from 'next/cache';

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

export async function getProducts(): Promise<Product[]> {
  return await prisma.product.findMany();
}
export async function getCartId(): Promise<number> {
  let userId = await getUserId();
  let cart = await prisma.cart.findUnique({ where: { userId: userId } });
  if (cart == null) {
    return -1 // should never happen due to database constraint
  } else {
    return cart.id;
  }
}
export type AddToCartState = {
  success?: boolean;
  error?: string;
  data?: any;
};
export async function addToCartAction(_prevState: AddToCartState, formData: FormData): Promise<AddToCartState>{
  try {
    const cartId = parseInt(formData.get('cartId') as string);
    const productId = parseInt(formData.get('productId') as string);
    const quantity = parseInt(formData.get('quantity') as string);
    let userId = await getUserId();
    console.log(cartId, userId)
    const addedItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cartId,
          productId: productId,
        },
      },
      update: {
        quantity: quantity
      },
      create: {
        cartId: cartId,
        productId: productId,
        quantity: quantity,
      },
    });
    revalidatePath('/home');
    return { success: true, data: addedItem };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error: 'Failed to add to cart' };
  }
}
// --- SERVER ACTION ---
export type SerializedProduct = Omit<
  Product,
  "pricePerUnit" | "weightPerUnit"
> & {
  pricePerUnit: number;
  weightPerUnit: number;
};

export interface CartItem {
  cartId: number;
  id: number;
  productId: number;
  quantity: number;
  product: SerializedProduct;
}