"use server";

import prisma from "@/lib/prisma";
import { CartItem, Prisma, Product } from "@prisma/client";
import { revalidatePath } from "next/cache";

const cartWithItemsAndProduct = Prisma.validator<Prisma.CartDefaultArgs>()({
  include: {
    cartItems: {
      include: {
        product: true,
      },
    },
  },
});

export type CartWithItemsAndProduct = Prisma.CartGetPayload<
  typeof cartWithItemsAndProduct
>;
export type SerializedCartItem = CartItem & {
  product: Omit<Product, "pricePerUnit" | "weightPerUnit"> & {
    pricePerUnit: number;
    weightPerUnit: number;
  };
};

export async function getUserCart(
  userId: string
): Promise<CartWithItemsAndProduct> {
  // First, ensure the user exists in the database
  let user = await prisma.user.findUnique({
    where: { authId: userId },
  });

  if (!user) {
    throw Error("User not found");
  }

  let cart = await prisma.cart.findUnique({
    where: {
      userId: user.id,
    },
    ...cartWithItemsAndProduct,
  });

  //   Create a new cart for user if doesn't exist
  if (cart === null) {
    let newCart: Prisma.CartCreateInput;
    newCart = {
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    cart = await prisma.cart.create({
      data: newCart,
      ...cartWithItemsAndProduct,
    });
  }

  return cart;
}

export async function removeCartItem(cartId: number) {
  await prisma.cartItem.delete({
    where: { id: cartId },
  });

  revalidatePath("/shopping-cart");
  revalidatePath("/layout.tsx");
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

  revalidatePath("/shopping-cart");
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

  revalidatePath("/shopping-cart");
  return { success: true };
}
