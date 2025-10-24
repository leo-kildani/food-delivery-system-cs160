"use server";

import prisma from "@/lib/prisma";
import { Order, Vehicle } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type DeployState = {
  success?: boolean;
  error?: string;
  deployedVehicleId?: number;
};

export async function deployVehicleAction(
  prevState: DeployState,
  formData: FormData
): Promise<DeployState> {
  try {
    const vehicleId = parseInt(formData.get('vehicleId') as string);
    const orderIds = JSON.parse(formData.get('orderIds') as string) as number[];

    if (!vehicleId || !orderIds || orderIds.length === 0) {
      return { success: false, error: 'Invalid vehicle or no orders assigned' };
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update vehicle status to IN_TRANSIT (deployed)
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'IN_TRANSIT' }
      });

      // Update all assigned orders
      const updatedOrders = await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { 
          status: 'IN_TRANSIT',
          VehicleId: vehicleId
        }
      });

      return { vehicle: updatedVehicle, orderCount: updatedOrders.count };
    });

    console.log(`Vehicle ${vehicleId} deployed with ${result.orderCount} orders`);
    
    // Revalidate the page to show updated data
    revalidatePath('/admin/vehicles');
    
    return { 
      success: true, 
      deployedVehicleId: vehicleId 
    };

  } catch (error) {
    console.error('Error deploying vehicle:', error);
    return { 
      success: false, 
      error: 'Failed to deploy vehicle. Please try again.' 
    };
  }
}

export interface VehicleWithOrders extends Vehicle {
  assignedOrdersCount: number;
  totalAssignedWeight: number;
}

export async function getVehicles(): Promise<VehicleWithOrders[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      orders: {
        include: {
          orderItems: true
        }
      }
    }
  });

  // Calculate order count and total weight for each vehicle
  const vehiclesWithOrders = vehicles.map(vehicle => {
    const assignedOrdersCount = vehicle.orders.length;
    
    // Calculate total weight from all assigned orders
    const totalAssignedWeight = vehicle.orders.reduce((totalWeight, order) => {
      const orderWeight = order.orderItems.reduce((orderTotal, item) => {
        return orderTotal + (item.weightPerUnit.toNumber() * item.quantity);
      }, 0);
      return totalWeight + orderWeight;
    }, 0);

    // Convert vehicle object to ensure all Decimals are converted to numbers
    const vehicleData = {
      ...vehicle,
      // Convert any Decimal fields if they exist
      orders: vehicle.orders.map(order => ({
        ...order,
        orderItems: order.orderItems.map(item => ({
          ...item,
          pricePerUnit: item.pricePerUnit.toNumber(),
          weightPerUnit: item.weightPerUnit.toNumber()
        }))
      })),
      assignedOrdersCount,
      totalAssignedWeight
    };

    return vehicleData;
  });

  return vehiclesWithOrders;
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