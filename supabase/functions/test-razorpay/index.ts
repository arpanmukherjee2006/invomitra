import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    const config = {
      hasKeyId: !!razorpayKeyId,
      hasKeySecret: !!razorpayKeySecret,
      keyIdPrefix: razorpayKeyId ? razorpayKeyId.substring(0, 8) + '...' : 'NOT_SET',
      keySecretPrefix: razorpayKeySecret ? razorpayKeySecret.substring(0, 8) + '...' : 'NOT_SET'
    };

    return new Response(JSON.stringify({ 
      status: 'ok',
      config,
      message: config.hasKeyId && config.hasKeySecret ? 
        'Razorpay is properly configured' : 
        'Razorpay configuration is incomplete'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      status: 'error',
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

