-- Add GST fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN company_gstin text,
ADD COLUMN client_gstin text,
ADD COLUMN place_of_supply text,
ADD COLUMN gst_type text DEFAULT 'igst', -- 'igst', 'cgst_sgst'
ADD COLUMN cgst_rate numeric DEFAULT 0,
ADD COLUMN sgst_rate numeric DEFAULT 0,
ADD COLUMN igst_rate numeric DEFAULT 0,
ADD COLUMN cgst_amount numeric DEFAULT 0,
ADD COLUMN sgst_amount numeric DEFAULT 0,
ADD COLUMN igst_amount numeric DEFAULT 0;

-- Add HSN/SAC code to invoice items
ALTER TABLE public.invoice_items 
ADD COLUMN hsn_sac_code text,
ADD COLUMN cgst_rate numeric DEFAULT 0,
ADD COLUMN sgst_rate numeric DEFAULT 0,
ADD COLUMN igst_rate numeric DEFAULT 0,
ADD COLUMN cgst_amount numeric DEFAULT 0,
ADD COLUMN sgst_amount numeric DEFAULT 0,
ADD COLUMN igst_amount numeric DEFAULT 0,
ADD COLUMN taxable_amount numeric DEFAULT 0;

-- Add GST fields to company profiles
ALTER TABLE public.profiles 
ADD COLUMN gstin text,
ADD COLUMN state_code text,
ADD COLUMN place_of_business text;