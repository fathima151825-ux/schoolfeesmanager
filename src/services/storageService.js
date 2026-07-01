import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'student-photos';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Validate file before upload
export function validatePhotoFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!ALLOWED_TYPES?.includes(file?.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }

  if (file?.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 2MB limit.' };
  }

  return { valid: true };
}

// Upload student photo
export async function uploadStudentPhoto(file, studentId) {
  try {
    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation?.valid) {
      throw new Error(validation.error);
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileExt = file?.name?.split('.')?.pop();
    const filePath = `${studentId}/${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase?.storage?.from(BUCKET_NAME)?.upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    return { success: true, filePath: data?.path };
  } catch (error) {
    console.error('Upload student photo error:', error);
    throw error;
  }
}

// Get signed URL for student photo (private bucket)
export async function getStudentPhotoUrl(filePath) {
  try {
    if (!filePath) {
      return null;
    }

    const { data, error } = await supabase?.storage?.from(BUCKET_NAME)?.createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      throw error;
    }

    return data?.signedUrl;
  } catch (error) {
    console.error('Get student photo URL error:', error);
    return null;
  }
}

// Delete student photo
export async function deleteStudentPhoto(filePath) {
  try {
    if (!filePath) {
      return { success: true };
    }

    const { error } = await supabase?.storage?.from(BUCKET_NAME)?.remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Delete student photo error:', error);
    throw error;
  }
}

// Update student photo URL in database
export async function updateStudentPhotoUrl(studentId, photoUrl) {
  try {
    const { data, error } = await supabase?.from('students')?.update({ photo_url: photoUrl })?.eq('id', studentId)?.select()?.single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update student photo URL error:', error);
    throw error;
  }
}