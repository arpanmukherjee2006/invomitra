-- Update subscribers table to use Razorpay instead of Stripe
ALTER TABLE public.subscribers 
RENAME COLUMN stripe_customer_id TO razorpay_customer_id;

-- Add additional Razorpay-specific columns
ALTER TABLE public.subscribers 
ADD COLUMN razorpay_subscription_id TEXT,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN last_payment_id TEXT;

-- Create index for Razorpay customer ID
CREATE INDEX IF NOT EXISTS idx_subscribers_razorpay_customer_id ON public.subscribers(razorpay_customer_id);

-- Create index for Razorpay subscription ID
CREATE INDEX IF NOT EXISTS idx_subscribers_razorpay_subscription_id ON public.subscribers(razorpay_subscription_id);

