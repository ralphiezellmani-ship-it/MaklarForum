import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!stripeKey || !priceId || !siteUrl) {
    return NextResponse.json({ error: "Missing Stripe configuration" }, { status: 500 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, email, stripe_customer_id")
    .eq("id", auth.user.id)
    .single();

  if (!profile || profile.role !== "agent") {
    return NextResponse.json({ error: "Only agents can purchase premium" }, { status: 403 });
  }

  try {
    const stripe = new Stripe(stripeKey);

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { profile_id: profile.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", profile.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/maklare?billing=success`,
      cancel_url: `${siteUrl}/priser?billing=cancelled`,
      metadata: {
        profile_id: profile.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
