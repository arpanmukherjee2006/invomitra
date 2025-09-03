-- Add payment_qr field to invoices table for storing payment QR codes
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_qr TEXT;