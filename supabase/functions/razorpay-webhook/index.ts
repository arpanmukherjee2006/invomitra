import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || req.headers.get("X-Razorpay-Signature");
    if (!signature) throw new Error("Missing X-Razorpay-Signature header");

    // Verify signature
    const expected = await hmacHex(webhookSecret, body);
    if (signature !== expected) throw new Error("Invalid webhook signature");

    const event = JSON.parse(body);
    console.log("Webhook event:", event?.event);

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      if (!payment) throw new Error("Missing payment payload");

      const email: string | null = payment.email ?? payment.notes?.user_email ?? null;
      if (!email) throw new Error("No email on payment payload");

      const planType = payment.amount >= 99900 ? "Pro Yearly" : "Pro Monthly";
      const days = payment.amount >= 99900 ? 365 : 30;

      const { error } = await supabaseClient
        .from("subscribers")
        .upsert({
          email,
          user_id: null,
          razorpay_customer_id: payment.customer_id ?? null,
          subscribed: true,
          subscription_tier: planType,
          subscription_end: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          payment_status: "completed",
          last_payment_id: payment.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });

      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
