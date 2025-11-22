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
