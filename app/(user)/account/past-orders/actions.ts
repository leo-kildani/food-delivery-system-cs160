"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function getPastOrders() {
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

  // Get orders that are COMPLETE, CANCELLED, or REFUNDED
  const orders = await prisma.order.findMany({
    where: {
      userId: personal_user.id,
      status: {
        in: ["COMPLETE", "CANCELLED", "REFUNDED"],
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
