import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      console.error("Auth error:", userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const requestBody = await req.json();
    const { priceType } = requestBody;
    
    if (!priceType || !['monthly', 'yearly'].includes(priceType)) {
      throw new Error("Invalid or missing priceType. Must be 'monthly' or 'yearly'");
    }
    
    logStep("Request body parsed", { priceType });

    // Get Razorpay credentials from environment
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      logStep("ERROR: Razorpay credentials missing", { 
        hasKeyId: !!razorpayKeyId, 
        hasKeySecret: !!razorpayKeySecret 
      });
      throw new Error("Razorpay credentials not configured");
    }
    logStep("Razorpay credentials verified");

    // Determine price based on priceType (in paise for Razorpay)
    const amount = priceType === 'yearly' ? 99900 : 9900; // ₹999 or ₹99 in paise
    const currency = "INR";
    
    logStep("Price calculated", { priceType, amount, currency });

    // Create shorter receipt ID (max 40 chars) - using timestamp and random string
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const randomId = Math.random().toString(36).substring(2, 8); // 6 char random string
    const shortReceipt = `inv_${timestamp}_${randomId}`; // inv_12345678_abc123 (max 19 chars)
    
    logStep("Generated receipt", { receipt: shortReceipt, length: shortReceipt.length });

    // Create Razorpay order
    const orderData = {
      amount: amount,
      currency: currency,
      receipt: shortReceipt,
      notes: {
        user_id: user.id,
        user_email: user.email,
        plan_type: priceType,
        product: "InvoMitra Pro Plan"
      }
    };

    logStep("Final order data being sent to Razorpay", { 
      ...orderData, 
      receiptLength: orderData.receipt.length 
    });

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    logStep("Creating Razorpay order", { orderData });
    
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      logStep("ERROR: Razorpay API failed", { status: razorpayResponse.status, error: errorData });
      
      // Try to parse the error for more specific information
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error) {
          // Check for specific error types
          if (errorJson.error.code === 'BAD_REQUEST_ERROR') {
            throw new Error(`Invalid payment request: ${errorJson.error.description}`);
          } else if (errorJson.error.code === 'GATEWAY_ERROR') {
            throw new Error(`Payment gateway error: ${errorJson.error.description}`);
          }
        }
      } catch (parseError) {
        // If parsing fails, continue with generic error
        console.error("Error parsing Razorpay error response:", parseError);
      }
      throw new Error(`Razorpay API error: ${errorData}`);
    }

    const order = await razorpayResponse.json();
    logStep("Razorpay order created successfully", { orderId: order.id });

    // Store order in database for tracking
    const { error: dbError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: user.id,
        email: user.email,
        subscribed: false, // Will be updated after successful payment
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      });

    if (dbError) {
      logStep("WARNING: Failed to update subscriber record", { error: dbError });
      // Don't fail the request, just log the warning
    }

    // Return order details for frontend Razorpay integration
    const responseData = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      planType: priceType,
      userEmail: user.email,
      userName: user.user_metadata?.full_name || ''
    };

    logStep("Returning successful response", responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});