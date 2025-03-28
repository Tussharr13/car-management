-- Add images array column to store multiple image URLs
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS images TEXT[];

-- Add cover_image column to store the main image URL
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Create storage policies for car-images bucket
-- Note: You need to create the car-images bucket in the Supabase dashboard first

-- Drop existing policies if they exist (optional, comment out if not needed)
-- DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can read car images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete from their own folder" ON storage.objects;

-- Create a policy that allows authenticated users to upload files to their own folder
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload to their own folder'
    ) THEN
        EXECUTE $policy$
        CREATE POLICY "Users can upload to their own folder"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'car-images' AND
          (storage.foldername(name))[1] IN (
            SELECT id::text FROM cars WHERE user_id = auth.uid()
          )
        )
        $policy$;
    END IF;
END
$$;

-- Create a policy that allows authenticated users to read any file in the car-images bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Anyone can read car images'
    ) THEN
        EXECUTE $policy$
        CREATE POLICY "Anyone can read car images"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (bucket_id = 'car-images')
        $policy$;
    END IF;
END
$$;

-- Create a policy that allows authenticated users to delete files from their own folder
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete from their own folder'
    ) THEN
        EXECUTE $policy$
        CREATE POLICY "Users can delete from their own folder"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'car-images' AND
          (storage.foldername(name))[1] IN (
            SELECT id::text FROM cars WHERE user_id = auth.uid()
          )
        )
        $policy$;
    END IF;
END
$$; 