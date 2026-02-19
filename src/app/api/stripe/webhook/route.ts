import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe webhook configuration" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${(error as Error).message}` }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = String(subscription.customer);

    const status = subscription.status === "active" ? "active" : subscription.status === "trialing" ? "trial" : "past_due";

    await admin
      .from("profiles")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: status,
      })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = String(subscription.customer);

    await admin
      .from("profiles")
      .update({
        subscription_status: "canceled",
      })
      .eq("stripe_customer_id", customerId);
  }

  await admin.from("billing_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
    status: "processed",
  });

  if (event.type.startsWith("invoice.")) {
    await admin.from("fortnox_sync_queue").insert({
      source: "stripe",
      reference_id: event.id,
      payload: event as unknown as Record<string, unknown>,
      status: "pending",
    });
  }

  return NextResponse.json({ received: true });
}
