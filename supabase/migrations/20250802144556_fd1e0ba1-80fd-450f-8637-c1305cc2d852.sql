-- Add currency field to profiles table
ALTER TABLE public.profiles ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Add currency field to invoices table  
ALTER TABLE public.invoices ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';