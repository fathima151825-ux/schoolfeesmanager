-- Add video_url column to advertisements table
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS video_url TEXT;
