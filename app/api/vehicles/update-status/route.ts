import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      !user ||
      (user.user_metadata?.role !== "admin" && user.user_metadata?.role !== "empl")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { vehicleId, status, eta } = (await request.json()) as {
      vehicleId: number;
      status: string;
      eta?: number;
    };

    if (!vehicleId || !status) {
      return NextResponse.json(
        { error: "vehicleId and status required" },
        { status: 400 }
      );
    }

    const updateData: { status: string; eta?: number | null } = { status };
    
    // Set eta if provided, or null if status is STANDBY
    if (eta !== undefined) {
      updateData.eta = eta;
      console.log("update eta");
    } else if (status === 'STANDBY') {
      updateData.eta = null;
    }

    // If status is STANDBY, clear VehicleId from all orders assigned to this vehicle
    if (status === 'STANDBY') {
      await prisma.order.updateMany({
        where: { VehicleId: vehicleId },
        data: { VehicleId: null },
      });
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
      select: { id: true, status: true, eta: true },
    });


    
    // Revalidate vehicles admin page to reflect new status
    revalidatePath("/admin/vehicles");

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (e) {
    console.error("Vehicle status update error:", e);
    return NextResponse.json(
      { error: "Failed to update vehicle status" },
      { status: 500 }
    );
  }
}
