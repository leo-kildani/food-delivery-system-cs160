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

    const { vehicleId, status } = (await request.json()) as {
      vehicleId: number;
      status: string;
    };

    if (!vehicleId || !status) {
      return NextResponse.json(
        { error: "vehicleId and status required" },
        { status: 400 }
      );
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status },
      select: { id: true, status: true },
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
