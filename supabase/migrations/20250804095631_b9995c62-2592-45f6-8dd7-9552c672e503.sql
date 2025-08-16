-- Add client details columns to invoices table to match the current form structure
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT;

-- Update existing invoices with default client name if they don't have one
UPDATE public.invoices 
SET client_name = 'Client Name'
WHERE client_name IS NULL;