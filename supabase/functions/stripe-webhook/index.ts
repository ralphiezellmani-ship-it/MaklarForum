// Handles Stripe subscription webhooks and syncs status to profiles.subscription_status.
// Intended runtime: Supabase Edge Functions (Deno)

export {};

type DenoLike = {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const denoRuntime = (globalThis as { Deno?: DenoLike }).Deno;

if (denoRuntime) {
  denoRuntime.serve(async (req) => {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe signature", { status: 400 });
    }

    const body = await req.text();

    // TODO:
    // 1) Verify webhook signature with STRIPE_WEBHOOK_SECRET
    // 2) Parse invoice/subscription events
    // 3) Map Stripe customer/subscription to profiles table
    // 4) Update subscription_status and premium feature flags atomically

    return Response.json({ ok: true, received: body.length > 0 });
  });
}
