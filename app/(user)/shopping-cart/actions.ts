"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CartItem, Product } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type CartItemWithProduct = CartItem & {
  product: Product;
};

export async function getCartItems(): Promise<CartItemWithProduct[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Find the user in your database
  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: {
      cart: {
        include: {
          cartItems: {
            include: {
              product: true,
            },
            orderBy: {
              productId: 'desc', 
            },
          },
        },
      },
    },
  });

  return dbUser?.cart?.cartItems ?? [];
}

export async function removeCartItem(cartId: number) {
  await prisma.cartItem.delete({
    where: { id: cartId },
  });

  revalidatePath("/shopping-cart");
}

export async function updateCartItemQuantity(cartItemId: number, newQuantity: number) {
  if (newQuantity < 1) {
    return;
  }

  // Update the quantity
  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: newQuantity },
  });

  revalidatePath("/shopping-cart");
}