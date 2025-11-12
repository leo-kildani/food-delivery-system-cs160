"use server";

import prisma from "@/lib/prisma";
import { Order, OrderItem, Product } from "@prisma/client";

export interface Activity {
  activeUsers: number;
  activeOrders: number;
}
export async function getActivity(): Promise<Activity> {
  const activeOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      }, // gte = greater than or equal to
    },
  });
  const activeUsers = new Set(activeOrders.map((order) => order.userId));
  return {
    activeUsers: activeUsers.size,
    activeOrders: activeOrders.length,
  };
}

export interface RecentOrder {
  order: Order;
  totalWeight: number;
}
export async function getRecentOrders(): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
      },
    },
  });
  const packaged_orders = orders.map(async (order) => {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: order.id,
      },
    });
    // Calculate total price and weight if needed
    const items = await orderItems;
    let totalWeight: number = 0;
    items.forEach((item) => {
      totalWeight += item.weightPerUnit.toNumber() * item.quantity;
    });
    return { order, totalWeight };
  });
  return Promise.all(packaged_orders);
}

export interface PopularProductData {
  name: string;
  quantity: number;
  frequency: number;
}

export async function getPopularProducts(): Promise<PopularProductData[]> {
  // Get orders from last 30 days
  const recentOrderIds = (
    await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      select: {
        id: true, // Select only id field
      },
    })
  ).map((order) => order.id);
  // Get 5 most popular productIds from those orders
  const popularItems = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    _count: { orderId: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
    where: { orderId: { in: recentOrderIds } },
  });
  const productIds = popularItems.map((item) => item.productId);
  // Get the product details for the productIds
  const items = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
    },
  });
  // Make a Map for easy lookup of counts: productId -> quantity sold and
  const countMap = new Map(
    popularItems.map((item) => [
      item.productId,
      {
        totalQuantitySold: item._sum.quantity,
        ordersCount: item._count.orderId,
      },
    ])
  );

  const chartData: PopularProductData[] = items.map((product) => ({
    name: product.name,
    quantity: countMap.get(product.id)!.totalQuantitySold!,
    frequency: countMap.get(product.id)!.ordersCount! / recentOrderIds.length,
  }));

  return chartData;
}
