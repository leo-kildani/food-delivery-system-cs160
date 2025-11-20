import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

function getStripeInstance() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripeInstance();
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error("No orderId in session metadata");
          break;
        }

        // Update order with payment information
        await prisma.order.update({
          where: { id: parseInt(orderId) },
          data: {
            paymentStatus: "paid",
            stripePaymentId: session.payment_intent as string,
          },
        });

        // Remove items from cart
        const order = await prisma.order.findUnique({
          where: { id: parseInt(orderId) },
          include: { orderItems: true },
        });

        if (order) {
          const productIds = order.orderItems.map((item) => item.productId);
          const cart = await prisma.cart.findUnique({
            where: { userId: order.userId },
          });

          if (cart) {
            await prisma.cartItem.deleteMany({
              where: {
                cartId: cart.id,
                productId: { in: productIds },
              },
            });
          }
        }

        console.log(`Payment successful for order ${orderId}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          // Mark order as cancelled
          await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: {
              paymentStatus: "expired",
              status: "CANCELLED",
            },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", paymentIntent.id);
        // You could update the order status here if needed
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
