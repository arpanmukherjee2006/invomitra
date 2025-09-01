-- Fix security issue: Restrict subscription record creation to service accounts only
-- This prevents users from creating fake subscription records

-- First, drop the current overly permissive policy
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create a new restrictive policy that only allows service role to insert subscriptions
-- This ensures only the backend services (like payment webhooks) can create subscription records
CREATE POLICY "service_only_insert_subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (false);

-- Allow updates for authenticated users to their own records (for linking user_id)
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription" 
ON public.subscribers 
FOR UPDATE 
USING (user_id = auth.uid() OR email = auth.email());

-- The select policy remains the same for users to view their own subscriptions
-- Users can still view their subscription status but cannot create fake records