"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userData = await prisma.user.findUnique({
    where: { authId: user?.id },
  });
  return userData?.id;
}

export async function getPastOrders() {
  const userId = await getUserId();
  if (!userId) return [];

  const orders = await prisma.order.findMany({
    where: {
      userId: userId,
      status: "COMPLETE",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  return orders;
}
