'use server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Order, Vehicle } from '@prisma/client';

export async function getVehicles() : Promise<Vehicle[]> {
  const vehicles = await prisma.vehicle.findMany({});
  return vehicles;
}
interface PendingOrder {
  order: Order,
  totalPrice: number,
  totalWeight: number,
}
export async function getPendingOrders(): Promise<PendingOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: 'PENDING'
    }
  })
  const packaged_orders= orders.map(async (order) => {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: order.id
      }
    });
    // Calculate total price and weight if needed
    const items = await orderItems;
    let totalPrice: number = 0;
    let totalWeight: number = 0;
    items.forEach((item) => {
      totalPrice += item.pricePerUnit.toNumber() * item.quantity;
      totalWeight += item.weightPerUnit.toNumber() * item.quantity;
    });
    return { order, totalPrice, totalWeight };
  });
  return Promise.all(packaged_orders);
}