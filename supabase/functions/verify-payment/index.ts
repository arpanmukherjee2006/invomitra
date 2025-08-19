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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error("Missing payment verification parameters");
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay key secret not configured");
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = await hmacHex(razorpayKeySecret, body);

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature verification failed", {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      throw new Error("Invalid payment signature");
    }
    
    console.log("Payment signature verified successfully");

    // Fetch payment details from Razorpay
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    if (!razorpayKeyId) {
      throw new Error("Razorpay key ID not configured");
    }
    
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    try {
      const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: {
          "Authorization": `Basic ${auth}`,
        },
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error("Razorpay API error:", {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          body: errorText,
        });
        
        // Check for specific payment method errors
        let errorMessage = `Failed to fetch payment details from Razorpay: ${paymentResponse.status} ${paymentResponse.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            // Check for PhonePe specific errors
            if (errorJson.error.description?.toLowerCase().includes('phonepe') || 
                errorJson.error.reason?.toLowerCase().includes('phonepe') ||
                errorJson.error.source?.toLowerCase().includes('phonepe')) {
              errorMessage = "PhonePe is facing issues. Please try with a different payment method.";
            } else if (errorJson.error.code === 'BAD_REQUEST_ERROR') {
              errorMessage = "Payment details are invalid. Please retry with the right details.";
            }
          }
        } catch (parseError) {
          console.error("Error parsing Razorpay error response:", parseError);
        }
        
        throw new Error(errorMessage);
      }

      const payment = await paymentResponse.json();
      console.log("Payment details fetched successfully:", { paymentId: payment.id, status: payment.status });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      throw new Error(`Error fetching payment details: ${error.message}`);
    }

    if (payment.status !== "captured") {
      throw new Error("Payment not captured");
    }

    // Update subscription in database
    const planType = payment.amount >= 99900 ? "Pro Yearly" : "Pro Monthly";
    const days = payment.amount >= 99900 ? 365 : 30;

    const { error } = await supabaseClient
      .from("subscribers")
      .upsert({
        email: user.email,
        user_id: user.id,
        razorpay_customer_id: payment.customer_id ?? null,
        subscribed: true,
        subscription_tier: planType,
        subscription_end: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        payment_status: "completed",
        last_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" });

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to update subscription");
    }

    return new Response(JSON.stringify({ 
      success: true,
      subscription: {
        tier: planType,
        expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    
    // Determine appropriate error message and status code
    let statusCode = 400;
    let errorMessage = error.message || "Payment verification failed";
    
    // Check for specific error types to provide better user feedback
    if (errorMessage.includes("PhonePe")) {
      statusCode = 422; // Unprocessable Entity - payment provider issue
    } else if (errorMessage.includes("invalid") || errorMessage.includes("details")) {
      statusCode = 400; // Bad Request - invalid input
    } else if (errorMessage.includes("Authentication failed")) {
      statusCode = 401; // Unauthorized
    } else if (errorMessage.includes("not configured")) {
      statusCode = 500; // Server Error - configuration issue
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: statusCode,
      paymentId: error.paymentId || null,
      suggestion: errorMessage.includes("PhonePe") ? "Try other payment apps" : "Please retry with different payment details"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
