-- Add UPI to payment_method enum
-- The existing enum is: 'online', 'cash', 'cheque'
-- We need to add 'upi' as a new value

ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'upi';

-- Add utr_number column for UPI Transaction Reference Number
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS utr_number TEXT;

-- Add screenshot_url column for UPI payment screenshot
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Add verified_by column for admin who verified UPI payment
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Add verified_at column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Index for faster UPI payment queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_utr_number ON public.payments(utr_number);
