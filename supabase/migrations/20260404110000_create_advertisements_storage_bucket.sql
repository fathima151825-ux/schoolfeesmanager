-- Create public storage bucket for advertisement images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisements',
  'advertisements',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Allow anyone to read advertisement images (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'advertisements_public_read'
  ) THEN
    CREATE POLICY "advertisements_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'advertisements');
  END IF;
END $$;

-- Allow authenticated admins to upload advertisement images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'advertisements_admin_insert'
  ) THEN
    CREATE POLICY "advertisements_admin_insert"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'advertisements'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- Allow authenticated admins to delete advertisement images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'advertisements_admin_delete'
  ) THEN
    CREATE POLICY "advertisements_admin_delete"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'advertisements'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;
