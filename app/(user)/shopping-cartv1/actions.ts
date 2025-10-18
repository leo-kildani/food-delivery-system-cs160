"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CartItem, Product } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
              productId: "desc",
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

  revalidatePath("/shopping-cartv1");
}

export async function updateCartItemQuantity(
  cartItemId: number,
  newQuantity: number
) {
  if (newQuantity < 1) {
    return { success: false, error: "Quantity must be at least 1" };
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: newQuantity },
  });

  revalidatePath("/shopping-cartv1");
  return { success: true };
}

export async function batchUpdateCartItems(
  updates: { id: number; quantity: number }[]
) {
  await prisma.$transaction(
    updates.map(({ id, quantity }) =>
      prisma.cartItem.update({
        where: { id },
        data: { quantity },
      })
    )
  );

  revalidatePath("/shopping-cartv1");
  return { success: true };
}

// SERVER ACTION
export type removeItemState = {
  ok?: boolean;
  error?: string;
};

export async function removeCartItemAction(
  _prevState: removeItemState,
  formData: FormData
): Promise<removeItemState> {
  try {
    const cartItemId = formData.get("cartItemId");
    
    if (!cartItemId) {
      return { ok: false, error: "Cart item ID is required" };
    }
    
    await removeCartItem(Number(cartItemId));
    revalidatePath("/shopping-cartv1");

    return { ok: true };
    
  } catch (error) {
    console.error("Error removing cart item:", error);
    return { ok: false, error: "Failed to remove item" };
  }
}