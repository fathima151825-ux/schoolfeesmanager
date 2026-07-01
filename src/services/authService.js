import { supabase, isSchemaError } from '../lib/supabase';

// Sign in with email and password (Admin/Owner)
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase?.auth?.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error during sign in:', error?.message);
        throw error;
      }
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Sign in with admission number and date of birth (Parent)
// NO Supabase auth required — credentials verified directly against DB
export async function signInWithAdmissionNumber(admissionNumber, dateOfBirth) {
  try {
    console.log('🔍 Parent Login Attempt:', {
      admissionNumber,
      dateOfBirth,
      dateFormat: 'YYYY-MM-DD expected'
    });

    // Step 1: Find student by admission number (anon access)
    const { data: student, error: studentError } = await supabase
      ?.from('students')
      ?.select('id, date_of_birth, admission_number, name')
      ?.eq('admission_number', admissionNumber)
      ?.maybeSingle();

    console.log('📊 Student Query Result:', {
      found: !!student,
      studentId: student?.id,
      studentName: student?.name,
      dbDateOfBirth: student?.date_of_birth,
      error: studentError
    });

    if (studentError) {
      console.error('❌ Student query error:', studentError);
      throw new Error('Database error. Please try again.');
    }

    if (!student) {
      console.error('❌ No student found with admission number:', admissionNumber);
      throw new Error('Invalid admission number or date of birth');
    }

    // Step 2: Compare dates
    const dbDate = student?.date_of_birth;
    const inputDate = dateOfBirth;

    console.log('📅 Date Comparison:', {
      dbDate,
      inputDate,
      match: dbDate === inputDate
    });

    if (dbDate !== inputDate) {
      console.error('❌ Date mismatch — invalid credentials');
      throw new Error('Invalid admission number or date of birth');
    }

    console.log('✅ Credentials verified — looking for parent record...');

    // Step 3: Find parent linked to this student
    const { data: parentStudent, error: parentError } = await supabase
      ?.from('parent_students')
      ?.select(`
        parent_id,
        father_name,
        mother_name,
        user_profiles!inner(
          id,
          email,
          full_name,
          role
        )
      `)
      ?.eq('student_id', student?.id)
      ?.maybeSingle();

    console.log('👨‍👩‍👧 Parent Query Result:', {
      found: !!parentStudent,
      parentId: parentStudent?.parent_id,
      fatherName: parentStudent?.father_name,
      motherName: parentStudent?.mother_name,
      hasUserProfile: !!parentStudent?.user_profiles,
      email: parentStudent?.user_profiles?.email,
      error: parentError
    });

    if (parentError) {
      console.error('❌ Parent query error:', parentError);
      throw new Error('Database error. Please try again.');
    }

    // Step 4: Build session even if no parent_students record exists
    // (student may not have a linked parent profile yet — still allow login)
    const parentId = parentStudent?.parent_id || student?.id;
    const parentEmail = parentStudent?.user_profiles?.email || null;
    const parentFullName =
      parentStudent?.user_profiles?.full_name ||
      parentStudent?.father_name ||
      'Parent';

    console.log('✅ Building parent session...');

    // Step 5: Store session in sessionStorage — NO Supabase auth needed
    const parentSession = {
      id: parentId,
      email: parentEmail,
      full_name: parentFullName,
      role: 'parent',
      student_id: student?.id,
      student_name: student?.name,
      admission_number: admissionNumber,
      authenticated_at: new Date()?.toISOString()
    };

    sessionStorage.setItem('parentSession', JSON.stringify(parentSession));
    sessionStorage.setItem('currentStudentId', student?.id);

    console.log('✅ Parent session created successfully!');

    return {
      parentId,
      email: parentEmail,
      studentId: student?.id,
      user: parentSession,
      session: parentSession
    };
  } catch (error) {
    console.error('❌ Parent login error:', error?.message || error);
    throw error;
  }
}

// Sign out
export async function signOut() {
  try {
    // Clear parent session from sessionStorage
    sessionStorage.removeItem('parentSession');
    sessionStorage.removeItem('currentStudentId');

    const { error } = await supabase?.auth?.signOut();
    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error during sign out:', error?.message);
        throw error;
      }
      // Ignore auth sign out errors for parent sessions (they don't have Supabase auth)
      console.warn('Sign out warning (expected for parent sessions):', error?.message);
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    // First check for a parent session in sessionStorage
    const parentSessionStr = sessionStorage.getItem('parentSession');
    if (parentSessionStr) {
      try {
        const parentSession = JSON.parse(parentSessionStr);
        if (parentSession?.id && parentSession?.role === 'parent') {
          return {
            id: parentSession?.id,
            email: parentSession?.email,
            role: 'parent'
          };
        }
      } catch (e) {
        sessionStorage.removeItem('parentSession');
      }
    }

    const { data: { user }, error } = await supabase?.auth?.getUser();

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error getting user:', error?.message);
        throw error;
      }
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.select('*')
      ?.eq('id', userId)
      ?.single();

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error getting profile:', error?.message);
        throw error;
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}
