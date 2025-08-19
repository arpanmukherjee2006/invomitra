import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      logStep("ERROR: RAZORPAY credentials not set");
      return new Response(JSON.stringify({ 
        error: "RAZORPAY credentials not set", 
        code: "CONFIG_ERROR",
        details: "The server is missing required payment gateway credentials."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    logStep("Razorpay credentials verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header provided");
      return new Response(JSON.stringify({ 
        error: "No authorization header provided", 
        code: "AUTH_ERROR",
        details: "Authentication token is missing. Please log in again."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR: Authentication error", { message: userError.message });
      return new Response(JSON.stringify({ 
        error: `Authentication error: ${userError.message}`, 
        code: "AUTH_FAILED",
        details: "Your session may have expired. Please log in again."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated or email not available");
      return new Response(JSON.stringify({ 
        error: "User not authenticated or email not available", 
        code: "USER_ERROR",
        details: "Unable to verify your account. Please ensure you have a valid email address and try again."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user exists in subscribers table
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();

    if (subscriberError && subscriberError.code !== 'PGRST116') {
      logStep("ERROR: Database error", { code: subscriberError.code, message: subscriberError.message });
      return new Response(JSON.stringify({ 
        error: `Database error: ${subscriberError.message}`, 
        code: "DB_ERROR",
        details: "There was an issue accessing your subscription information. Please try again later."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!subscriberData) {
      logStep("No subscriber found, creating new record");
      await supabaseClient.from("subscribers").insert({
        email: user.email,
        user_id: user.id,
        razorpay_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If user has a Razorpay customer ID, check their subscription status
    if (subscriberData.razorpay_customer_id) {
      logStep("Found Razorpay customer", { customerId: subscriberData.razorpay_customer_id });
      
      // Check subscription status from Razorpay
      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      
      // Get customer details from Razorpay
      let customerResponse;
      try {
        customerResponse = await fetch(`https://api.razorpay.com/v1/customers/${subscriberData.razorpay_customer_id}`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json"
          }
        });
      } catch (fetchError) {
        logStep("ERROR: Razorpay API fetch error", { message: fetchError.message });
        return new Response(JSON.stringify({ 
          error: `Razorpay API connection error: ${fetchError.message}`, 
          code: "API_CONNECTION_ERROR",
          details: "Unable to connect to payment provider. Please try again later."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        });
      }

      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        logStep("Customer details retrieved", { customerId: customer.id });
        
        // For now, we'll assume the subscription is active if customer exists
        // In a real implementation, you'd check subscription status from Razorpay
        const hasActiveSub = subscriberData.subscribed;
        const subscriptionTier = subscriberData.subscription_tier;
        const subscriptionEnd = subscriberData.subscription_end;

        logStep("Subscription status", { subscribed: hasActiveSub, tier: subscriptionTier });
        
        return new Response(JSON.stringify({
          subscribed: hasActiveSub,
          subscription_tier: subscriptionTier,
          subscription_end: subscriptionEnd
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Handle non-OK response from Razorpay API
        const statusCode = customerResponse.status;
        let responseBody;
        
        try {
          // Try to parse the error response
          responseBody = await customerResponse.json();
          logStep("Razorpay API error", { status: statusCode, body: responseBody });
        } catch (parseError) {
          // If we can't parse the response, use the status text
          logStep("Razorpay API error (unparseable)", { status: statusCode, statusText: customerResponse.statusText });
          responseBody = { error: { description: customerResponse.statusText } };
        }
        
        // Check if this is a temporary error or if the customer truly doesn't exist
        if (statusCode === 404) {
          // 404 means customer not found - update subscriber record
          logStep("Customer not found in Razorpay (404), updating to unsubscribed");
          await supabaseClient.from("subscribers").update({
            razorpay_customer_id: null,
            subscribed: false,
            subscription_tier: null,
            subscription_end: null,
            payment_status: 'pending',
            updated_at: new Date().toISOString(),
          }).eq("email", user.email);
          
          return new Response(JSON.stringify({ subscribed: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (statusCode >= 500) {
          // Server error from Razorpay - return error but don't update subscription status
          return new Response(JSON.stringify({ 
            error: "Razorpay server error", 
            code: "PAYMENT_PROVIDER_ERROR",
            details: "The payment provider is experiencing issues. Please try again later.",
            razorpay_status: statusCode,
            razorpay_error: responseBody.error?.description || "Unknown error"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 503, // Service Unavailable
          });
        } else {
          // Other error - could be authentication, rate limiting, etc.
          // Return current subscription status from database but log the error
          logStep("Razorpay API error, using cached subscription status", { status: statusCode });
          
          return new Response(JSON.stringify({
            subscribed: subscriberData.subscribed || false,
            subscription_tier: subscriberData.subscription_tier || null,
            subscription_end: subscriberData.subscription_end || null,
            warning: "Using cached subscription data due to payment provider API issues"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    } else {
      logStep("No Razorpay customer ID found, user is unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR in check-subscription", { message: errorMessage, stack: errorStack });
    
    // Determine error type and appropriate status code
    let statusCode = 500;
    let errorCode = "UNKNOWN_ERROR";
    let errorDetails = "An unexpected error occurred while checking your subscription.";
    
    if (errorMessage.includes("Authentication") || errorMessage.includes("auth")) {
      statusCode = 401;
      errorCode = "AUTH_ERROR";
      errorDetails = "Authentication failed. Please log in again.";
    } else if (errorMessage.includes("Razorpay") || errorMessage.includes("payment")) {
      statusCode = 503;
      errorCode = "PAYMENT_PROVIDER_ERROR";
      errorDetails = "Unable to connect to payment provider. Please try again later.";
    } else if (errorMessage.includes("Database") || errorMessage.includes("db")) {
      statusCode = 500;
      errorCode = "DATABASE_ERROR";
      errorDetails = "Database error occurred. Please try again later.";
    } else if (errorMessage.includes("Network") || errorMessage.includes("fetch") || errorMessage.includes("connection")) {
      statusCode = 503;
      errorCode = "NETWORK_ERROR";
      errorDetails = "Network connection issue. Please check your internet connection and try again.";
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: errorCode,
      details: errorDetails
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});