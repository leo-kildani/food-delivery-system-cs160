"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function getCurrentOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const personal_user = await prisma.user.findUnique({
    where: { authId: user.id },
  });

  if (!personal_user) {
    return [];
  }

  // Get orders that are PENDING or IN_TRANSIT (active orders)
  const orders = await prisma.order.findMany({
    where: {
      userId: personal_user.id,
      status: {
        in: ["PENDING", "IN_TRANSIT"],
      },
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
}
