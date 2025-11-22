"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { OrderStatus } from "@prisma/client";

export async function getUserOrders() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const authUser = await supabase.auth.getUser();

    if (!authUser.data.user?.id) {
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        authId: authUser.data.user.id,
      },
    });

    if (!user) {
      return null;
    }

    // Fetch all orders for the user
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        delivery: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return null;
  }
}

export type UserOrder = NonNullable<
  Awaited<ReturnType<typeof getUserOrders>>
>[number];

/**
 * Calculates the total amount for an order including surcharge for orders >= 20lbs
 * @param orderId - The ID of the order to calculate total for
 * @returns The calculated total amount or null if order not found
 */
export async function calculateAndUpdateOrderTotal(orderId: number) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    // Calculate subtotal from order items
    let subtotal = 0;
    let totalWeight = 0;

    for (const item of order.orderItems) {
      const itemTotal =
        parseFloat(item.pricePerUnit.toString()) * item.quantity;
      subtotal += itemTotal;

      const itemWeight =
        parseFloat(item.weightPerUnit.toString()) * item.quantity;
      totalWeight += itemWeight;
    }

    // Apply $10 surcharge if total weight is 20lbs or more
    const surcharge = totalWeight >= 20 ? 10 : 0;
    const totalAmount = subtotal + surcharge;

    // Update the order with the calculated total
    await prisma.order.update({
      where: { id: orderId },
      data: { totalAmount },
    });

    return totalAmount;
  } catch (error) {
    console.error("Error calculating order total:", error);
    return null;
  }
}
