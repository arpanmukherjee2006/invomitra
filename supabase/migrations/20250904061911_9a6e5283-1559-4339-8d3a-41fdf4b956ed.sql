-- Add upi_id column to invoices table for storing UPI ID
ALTER TABLE invoices ADD COLUMN upi_id text DEFAULT NULL;