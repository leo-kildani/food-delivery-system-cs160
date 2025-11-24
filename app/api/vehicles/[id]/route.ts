import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const vehicleId = parseInt(id, 10);
  if (Number.isNaN(vehicleId)) {
    return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        status: true,
        eta: true,
        orders: {
          select: {
            id: true,
            eta: true,
            status: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (e) {
    console.error("Vehicle fetch error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
