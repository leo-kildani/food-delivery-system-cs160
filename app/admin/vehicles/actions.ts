"use server";

import prisma from "@/lib/prisma";
import { Order, Vehicle } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Worker } from "worker_threads";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";

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
    const vehicleId = parseInt(formData.get("vehicleId") as string);
    const orderIds = JSON.parse(formData.get("orderIds") as string) as number[];

    if (!vehicleId || !orderIds || orderIds.length === 0) {
      return { success: false, error: "Invalid vehicle or no orders assigned" };
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update vehicle status to IN_TRANSIT (deployed)
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: "IN_TRANSIT" },
      });

      // Update all assigned orders
      const updatedOrders = await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          status: "IN_TRANSIT",
          VehicleId: vehicleId,
        },
      });

      return { vehicle: updatedVehicle, orderCount: updatedOrders.count };
    });

    console.log(
      `Vehicle ${vehicleId} deployed with ${result.orderCount} orders`
    );

    // Revalidate the page to show updated data
    revalidatePath("/admin/vehicles");

    return {
      success: true,
      deployedVehicleId: vehicleId,
    };
  } catch (error) {
    console.error("Error deploying vehicle:", error);
    return {
      success: false,
      error: "Failed to deploy vehicle. Please try again.",
    };
  }
}

export interface VehicleWithOrders extends Vehicle {
  assignedOrdersCount: number;
  totalAssignedWeight: number;
  orders: Array<{
    id: number;
    status: string;
    toAddress: string;
    orderItems: Array<{
      id: number;
      pricePerUnit: number;
      weightPerUnit: number;
      quantity: number;
    }>;
  }>;
}

export async function getVehicles(): Promise<VehicleWithOrders[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      orders: {
        include: {
          orderItems: true,
        },
      },
    },
  });

  // Calculate order count and total weight for each vehicle
  const vehiclesWithOrders = vehicles.map((vehicle) => {
    const assignedOrdersCount = vehicle.orders.length;

    // Calculate total weight from all assigned orders
    const totalAssignedWeight = vehicle.orders.reduce((totalWeight, order) => {
      const orderWeight = order.orderItems.reduce((orderTotal, item) => {
        return orderTotal + item.weightPerUnit.toNumber() * item.quantity;
      }, 0);
      return totalWeight + orderWeight;
    }, 0);

    // Convert vehicle object to ensure all Decimals are converted to numbers
    const vehicleData = {
      ...vehicle,
      // Convert any Decimal fields if they exist
      orders: vehicle.orders.map((order) => ({
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          pricePerUnit: item.pricePerUnit.toNumber(),
          weightPerUnit: item.weightPerUnit.toNumber(),
        })),
      })),
      assignedOrdersCount,
      totalAssignedWeight,
    };

    return vehicleData;
  });

  return vehiclesWithOrders;
}
interface PendingOrder {
  order: Order;
  totalPrice: number;
  totalWeight: number;
}
export async function getPendingOrders(): Promise<PendingOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      orderItems: true,
    }
  });

  return orders.map((order) => {
    let totalPrice = 0;
    let totalWeight = 0;

    const items = order.orderItems.map((item) => ({
      ...item,
      // convert Prisma Decimal -> number
      pricePerUnit: item.pricePerUnit.toNumber(),
      weightPerUnit: item.weightPerUnit.toNumber(),
    }));

    items.forEach((item) => {
      totalPrice += item.pricePerUnit * item.quantity;
      totalWeight += item.weightPerUnit * item.quantity;
    });

    return {
      order: {
        ...order,
        // attach converted items for further UI use if needed
        orderItems: items,
      } as any,
      totalPrice,
      totalWeight,
    };
  });
}

// Module-level worker registry to avoid duplicate workers per vehicle
const vehicleWorkers: Map<number, Worker> = new Map();

export async function scheduleVehicleCompletion(
  vehicleId: number,
  orderIds: number[]
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    // Use a transaction: first deduct product quantities, then mark orders COMPLETE,
    // clear their VehicleId, and set vehicle to STANDBY
    const res = await prisma.$transaction(async (tx) => {
      // 1) collect order items for these orders
      const items = await tx.orderItem.findMany({
        where: { orderId: { in: orderIds } },
      });

      // accumulate totals per productId
      const perProduct: Record<number, number> = {};
      items.forEach((it) => {
        perProduct[it.productId] = (perProduct[it.productId] || 0) + it.quantity;
      });

      // 2) update each product's quantityOnHand (clamp to >= 0)
      for (const [prodIdStr, qty] of Object.entries(perProduct)) {
        const prodId = Number(prodIdStr);
        const product = await tx.product.findUnique({ where: { id: prodId } });
        if (!product) continue;
        const current = product.quantityOnHand;
        const newQty = Math.max(0, current - qty);
        await tx.product.update({ where: { id: prodId }, data: { quantityOnHand: newQty } });
      }

      // 3) mark orders COMPLETE and clear VehicleId
      const updated = await tx.order.updateMany({
        where: { id: { in: orderIds }, VehicleId: vehicleId },
        data: { status: "COMPLETE", VehicleId: null },
      });

      // 4) set vehicle back to STANDBY
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: "STANDBY" },
      });

      return { updatedCount: updated.count, vehicle: updatedVehicle };
    });

    console.log(
      `Marked ${res.updatedCount} orders COMPLETE, deducted product stock and set vehicle ${vehicleId} to STANDBY`
    );

    return { success: true, updatedCount: res.updatedCount };
  } catch (e) {
    console.error("scheduleVehicleCompletion error:", e);
    return { success: false, error: String(e) };
  }
}

export async function startVehicleWorker(
  vehicleId: number,
  orderIds: number[],
  etaMinutes: number
): Promise<{ success: boolean; started?: boolean; error?: string }> {
  try {
    // Clear existing worker if present (replace with new ETA)
    const existing = vehicleWorkers.get(vehicleId);
    if (existing) {
      try {
        existing.terminate();
      } catch (e) {
        console.warn("Failed terminating existing worker", e);
      }
      vehicleWorkers.delete(vehicleId);
    }

    const delayMs = Math.max(30_000, Math.floor((etaMinutes / 10) * 60_000));

    // Resolve worker script on filesystem to avoid Turbopack/Next virtual URL issues
    const candidate = path.join(process.cwd(), "lib", "workers", "vehicle-completion-worker.js");
    let workerPath = candidate;
    if (!fs.existsSync(workerPath)) {
      // Fallback to URL import (may fail in dev with Turbopack)
      const workerFileUrl = new URL("../../../lib/workers/vehicle-completion-worker.js", import.meta.url);
      workerPath = workerFileUrl.href;
      console.warn("Worker file not found on disk, falling back to URL:", workerPath);
    }

    console.log("Starting worker with path:", workerPath);

    const worker = new Worker(workerPath, {
      workerData: { vehicleId, orderIds, delayMs },
    } as any);

    worker.on("message", async (msg: any) => {
      try {
        console.log("Worker message received:", msg);
        await scheduleVehicleCompletion(vehicleId, orderIds);
      } catch (e) {
        console.error("Error handling worker message:", e);
      } finally {
        vehicleWorkers.delete(vehicleId);
        try {
          worker.terminate();
        } catch (e) {
          /* ignore */
        }
      }
    });

    worker.on("error", (err) => {
      console.error("Worker error for vehicle", vehicleId, err);
      vehicleWorkers.delete(vehicleId);
    });

    worker.on("exit", (code) => {
      console.log("Worker exit", vehicleId, code);
      vehicleWorkers.delete(vehicleId);
    });

    vehicleWorkers.set(vehicleId, worker);

    console.log(`Started worker for vehicle ${vehicleId} (delay ${delayMs}ms)`);

    return { success: true, started: true };
  } catch (e) {
    console.error("startVehicleWorker error:", e);
    return { success: false, error: String(e) };
  }
}

// Server action wrapper usable from client components (React Server Actions)
export async function startVehicleWorkerAction(payload: {
  vehicleId: number;
  orderIds: number[];
  etaMinutes: number;
}) {
  'use server';
  const { vehicleId, orderIds, etaMinutes } = payload;
  const res = await startVehicleWorker(vehicleId, orderIds, etaMinutes);
  // Return the result to the client so the calling component can
  // close the modal and show feedback. Avoid redirecting from here
  // (server actions running in SSR contexts shouldn't call redirect
  // expecting client navigation when invoked from client components).
  return res;
}

// Server action to retrieve current statuses for a set of orders
export async function getOrderStatuses(payload: { orderIds: number[] }) {
  'use server';
  const { orderIds } = payload;
  try {
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, status: true },
    });
    return { success: true, orders };
  } catch (e) {
    console.error('getOrderStatuses error', e);
    return { success: false, error: String(e) };
  }
}
