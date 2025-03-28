-- Add images array column to store multiple image URLs
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add cover_image column to store the main image URL
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS cover_image TEXT; 