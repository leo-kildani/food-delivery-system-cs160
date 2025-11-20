import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function getStripeInstance() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  console.log('STRIPE_SECRET_KEY exists:', !!apiKey);
  console.log('STRIPE_SECRET_KEY length:', apiKey?.length);
  console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
  
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-10-29.clover",
  });
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const personal_user = await prisma.user.findUnique({
    where: { authId: user.id },
  });

  if (!personal_user?.id) {
    throw new Error("User not found");
  }

  return personal_user.id;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { selectedItems, selectedAddressId } = body;

    if (!selectedItems || selectedItems.length === 0) {
      return NextResponse.json(
        { error: "No items selected" },
        { status: 400 }
      );
    }

    // Get the delivery address
    const address = await prisma.deliveryAddress.findFirst({
      where: {
        id: parseInt(selectedAddressId),
        userId: userId,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Invalid delivery address" },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = selectedItems.reduce((total: number, item: any) => {
      return total + Number(item.pricePerUnit) * item.quantity;
    }, 0);

    // Create order in database with pending payment status
    const order = await prisma.order.create({
      data: {
        userId: userId,
        status: "PENDING",
        toAddress: address.address,
        createdAt: new Date(),
        paymentStatus: "pending",
        totalAmount: totalAmount,
      },
    });

    // Create order items
    await prisma.orderItem.createMany({
      data: selectedItems.map((item: any) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        weightPerUnit: item.weightPerUnit,
      })),
    });

    // Create Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = selectedItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName || `Product ${item.productId}`,
          description: item.description || "",
        },
        unit_amount: Math.round(Number(item.pricePerUnit) * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/checkout/cancel`,
      metadata: {
        orderId: order.id.toString(),
        userId: userId,
      },
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
