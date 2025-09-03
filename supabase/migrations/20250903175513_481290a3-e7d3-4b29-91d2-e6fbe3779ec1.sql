-- Add payment_amount column to invoices table
ALTER TABLE invoices ADD COLUMN payment_amount numeric DEFAULT 0;