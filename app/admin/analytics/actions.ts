"use server";

import prisma from "@/lib/prisma";
import { Order } from "@prisma/client";

export interface Activity {
  activeUsers: number;
  activeOrders: number;
}
// Gets number of active users (users who placed orders in last 30 days) and number of orders in last 30 days
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
// Gets orders from last 7 days and their total weight
export async function getRecentOrders(): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
      },
    },
    include: {
      orderItems: {
        select: {
          weightPerUnit: true,
          quantity: true,
        },
      },
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
  const packaged_orders = orders.map((order) => {
    const orderWeight = order.orderItems.reduce((orderItemSum, orderItem) => {
      return (
        orderItemSum + orderItem.weightPerUnit.toNumber() * orderItem.quantity
      );
    }, 0);
    return { order, totalWeight: orderWeight };
  });
  return Promise.all(packaged_orders);
}

export interface PopularProductData {
  name: string;
  quantity: number;
  frequency: number;
}
// Gets the 5 most popular products from orders in the last 30 days, along with the quantities sold and frequency seen in orders as a percentage
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
  // Extract product id values
  const productIds = popularItems.map((item) => item.productId);
  // Get the names of the productIds
  const items = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
    },
  });

  // Make maps for fast product name, quantity and order appearance lookup
  const nameMap = new Map(items.map((item) => [item.id, { name: item.name }]));
  const countMap = new Map(
    popularItems.map((item) => [
      item.productId,
      {
        totalQuantitySold: item._sum.quantity,
        ordersCount: item._count.orderId,
      },
    ])
  );
  // Collect data into chart data format
  const chartData: PopularProductData[] = productIds.map((productId) => ({
    name: nameMap.get(productId)!.name,
    quantity: countMap.get(productId)!.totalQuantitySold!,
    frequency: countMap.get(productId)!.ordersCount! / recentOrderIds.length,
  }));
  return chartData;
}
