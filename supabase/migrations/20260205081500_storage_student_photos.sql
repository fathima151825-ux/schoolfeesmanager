-- Student Photos Storage Bucket Migration
-- Private bucket for secure student photo storage

-- Create private bucket for student photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-photos',
    'student-photos',
    false,  -- PRIVATE bucket for security
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS Policy: Authenticated users (admin/owner) can upload student photos
CREATE POLICY "authenticated_upload_student_photos" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'student-photos');

-- RLS Policy: Authenticated users can view student photos
CREATE POLICY "authenticated_view_student_photos" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'student-photos');

-- RLS Policy: Authenticated users can update student photos
CREATE POLICY "authenticated_update_student_photos" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'student-photos')
WITH CHECK (bucket_id = 'student-photos');

-- RLS Policy: Authenticated users can delete student photos
CREATE POLICY "authenticated_delete_student_photos" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'student-photos');

-- Add photo_url column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS photo_url TEXT;