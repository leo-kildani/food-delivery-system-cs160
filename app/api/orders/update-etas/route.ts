import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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
    const { orderETAs } = (await request.json()) as {
      orderETAs: Array<{ orderId: number; etaMinutes: number }>;
    };

    if (!orderETAs || !Array.isArray(orderETAs)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Update all ETAs in a transaction
    await prisma.$transaction(
      orderETAs.map(({ orderId, etaMinutes }) =>
        prisma.order.update({
          where: { id: orderId },
          data: { eta: etaMinutes },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order ETAs:", error);
    return NextResponse.json(
      { error: "Failed to update order ETAs" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

  const orderIdParam = request.nextUrl.searchParams.get("orderId");
  if (!orderIdParam) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const orderId = parseInt(orderIdParam, 10);
  if (Number.isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, eta: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      etaMinutes: order.eta,
    });
  } catch (e) {
    console.error("GET ETA error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}