import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const razorpayWebhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!razorpayWebhookSecret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");
    }

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    
    if (!signature) {
      throw new Error("No signature provided");
    }

    // Verify webhook signature
    const expectedSignature = await createHmac("sha256", razorpayWebhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      logStep("ERROR: Invalid signature");
      throw new Error("Invalid signature");
    }

    const event = JSON.parse(body);
    logStep("Webhook verified", { event: event.event, paymentId: event.payload?.payment?.entity?.id });

    // Handle payment.captured event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount;
      const userEmail = payment.notes?.user_email;
      const userId = payment.notes?.user_id;
      const planType = payment.notes?.plan_type;

      logStep("Processing payment.captured", { 
        orderId, 
        paymentId, 
        amount, 
        userEmail, 
        userId, 
        planType 
      });

      if (!userEmail || !userId) {
        throw new Error("Missing user information in payment notes");
      }

      // Calculate subscription end date
      const subscriptionStart = new Date();
      const subscriptionEnd = new Date();
      
      if (planType === 'yearly') {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      } else {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      }

      // Update subscriber record
      const { error: updateError } = await supabaseClient
        .from('subscribers')
        .upsert({
          user_id: userId,
          email: userEmail,
          subscribed: true,
          subscription_tier: planType === 'yearly' ? 'Pro Yearly' : 'Pro Monthly',
          subscription_end: subscriptionEnd.toISOString(),
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        });

      if (updateError) {
        logStep("ERROR: Failed to update subscriber", { error: updateError });
        throw updateError;
      }

      logStep("Subscription activated successfully", { 
        userId, 
        userEmail, 
        subscriptionEnd: subscriptionEnd.toISOString() 
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in payment-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});