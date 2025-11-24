import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  console.log("POST /api/vehicles/complete - handler invoked");

  const supabase = await createClient();
  console.log("made it here");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    (user.user_metadata?.role !== "admin" &&
      user.user_metadata?.role !== "empl")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { vehicleId } = await request.json();

    if (!vehicleId) {
      return NextResponse.json(
        { error: "Vehicle ID required" },
        { status: 400 }
      );
    }

    // Transaction to update vehicle and orders
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get orders before updating to track which ones we're completing
      const ordersToComplete = await tx.order.findMany({
        where: { VehicleId: vehicleId },
        select: { id: true },
      });

      // 2. Update Vehicle: status STANDBY, eta null
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "STANDBY",
          eta: null,
        },
      });

      // 3. Update Orders: VehicleId null (unassign), status COMPLETE, eta null
      await tx.order.updateMany({
        where: { VehicleId: vehicleId },
        data: {
          VehicleId: null,
          status: "COMPLETE",
          eta: null,
        },
      });

      // 4. Fetch only the orders we just completed with serializable data
      const updatedOrders = await tx.order.findMany({
        where: { id: { in: ordersToComplete.map(o => o.id) } },
      });

      return updatedOrders.map(order => ({
        ...order,
        totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
      }));
    });

    console.log("Vehicle trip completed:", vehicleId);
    return NextResponse.json({ success: true, orders: result });
  } catch (error) {
    console.error("Error completing vehicle trip:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
