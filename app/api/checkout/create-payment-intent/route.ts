import { NextRequest, NextResponse } from "next/server";
import { Stripe } from "stripe";

// Make this route dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Lazy-load Stripe client to avoid initialization during build
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    const { amount } = await request.json();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Internal Error: ", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error}` },
      { status: 500 }
    );
  }
}
