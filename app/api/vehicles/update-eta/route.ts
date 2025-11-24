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
    return NextResponse.json(
      { error: "Forbidden, Admin Only" },
      { status: 403 }
    );
  }
  try {
    const { vehicleId, etaMinutes } = (await request.json()) as {
      vehicleId: number;
      etaMinutes: number;
    };

    if (!vehicleId || etaMinutes === undefined) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Update vehicle ETA
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { eta: etaMinutes },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating vehicle ETA:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle ETA" },
      { status: 500 }
    );
  }
}
