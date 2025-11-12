"use server";

import prisma from "@/lib/prisma";
import { Order, OrderStatus } from "@prisma/client";

// Extended order type with user and vehicle information
export type OrderWithDetails = Order & {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  delivery: {
    id: number;
    status: string;
  } | null;
};

export async function getAllOrders(): Promise<OrderWithDetails[]> {
  return await prisma.order.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      delivery: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOrdersByStatus(
  status: OrderStatus
): Promise<OrderWithDetails[]> {
  return await prisma.order.findMany({
    where: { status },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      delivery: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

