"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getCartItems(): Promise<CartItem[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Find the user in your database
  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: {
      cart: {
        include: {
          cartItems: true,
        },
      },
    },
  });

  return dbUser?.cart?.cartItems ?? [];
}

export async function removeCartItem(cartId: number) {
    const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }

  await prisma.cartItem.delete({
    where: { id: cartId },
  });

  // Revalidate the shopping cart page to show updated data
  revalidatePath("/shopping-cart");
}