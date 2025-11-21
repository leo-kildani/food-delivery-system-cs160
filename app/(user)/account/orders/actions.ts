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
