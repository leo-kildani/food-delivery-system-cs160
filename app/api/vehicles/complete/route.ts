import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
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
    await prisma.$transaction(async (tx) => {
      // 1. Update Vehicle: status STANDBY, eta null
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "STANDBY",
          eta: null,
        },
      });

      // 2. Update Orders: VehicleId null (unassign), status COMPLETE, eta null
      await tx.order.updateMany({
        where: { VehicleId: vehicleId },
        data: {
          VehicleId: null,
          status: "COMPLETE",
          eta: null,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing vehicle trip:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
