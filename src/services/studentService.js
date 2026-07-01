import { supabase, isSchemaError } from '../lib/supabase';

// Convert snake_case to camelCase
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj?.map(toCamelCase);

  return Object.keys(obj)?.reduce((acc, key) => {
    const camelKey = key?.replace(/_([a-z])/g, (_, letter) => letter?.toUpperCase());
    acc[camelKey] = typeof obj?.[key] === 'object' ? toCamelCase(obj?.[key]) : obj?.[key];
    return acc;
  }, {});
}

// Convert camelCase to snake_case
function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj?.map(toSnakeCase);

  return Object.keys(obj)?.reduce((acc, key) => {
    const snakeKey = key?.replace(/[A-Z]/g, letter => `_${letter?.toLowerCase()}`);
    acc[snakeKey] = typeof obj?.[key] === 'object' ? toSnakeCase(obj?.[key]) : obj?.[key];
    return acc;
  }, {});
}

// Get all students with payment status
export async function getAllStudents(academicYearId) {
  try {
    const { data, error } = await supabase?.from('students')?.select(`
        *,
        classes(id, name, display_name),
        parent_students(
          father_name,
          mother_name,
          father_mobile,
          mother_mobile,
          address
        )
      `)?.eq('is_active', true)?.order('admission_number', { ascending: true });

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    // Calculate payment status for each student
    const studentsWithStatus = await Promise.all(
      (data || [])?.map(async (student) => {
        const { data: statusData } = await supabase?.rpc('get_student_payment_status', {
            p_student_id: student?.id,
            p_academic_year_id: academicYearId
          });

        const { data: balanceData } = await supabase?.rpc('calculate_student_balance', {
            p_student_id: student?.id,
            p_academic_year_id: academicYearId
          });

        return {
          ...student,
          paymentStatus: statusData || 'pending',
          outstandingBalance: balanceData || 0,
          parentName: student?.parent_students?.[0]?.father_name || '',
          mobile: student?.parent_students?.[0]?.father_mobile || ''
        };
      })
    );

    return toCamelCase(studentsWithStatus);
  } catch (error) {
    console.error('Get all students error:', error);
    throw error;
  }
}

// Get student by ID
export async function getStudentById(studentId) {
  try {
    const { data, error } = await supabase?.from('students')?.select(`
        *,
        classes(id, name, display_name),
        parent_students(
          father_name,
          mother_name,
          father_mobile,
          mother_mobile,
          address
        )
      `)?.eq('id', studentId)?.single();

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return null;
    }

    return toCamelCase(data);
  } catch (error) {
    console.error('Get student by ID error:', error);
    return null;
  }
}

// Get student by admission number
export async function getStudentByAdmissionNumber(admissionNumber) {
  try {
    const { data, error } = await supabase?.from('students')?.select(`
        *,
        classes(id, name, display_name),
        parent_students(
          father_name,
          mother_name,
          father_mobile,
          mother_mobile,
          address
        )
      `)?.eq('admission_number', admissionNumber)?.single();

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return null;
    }

    return toCamelCase(data);
  } catch (error) {
    console.error('Get student by admission number error:', error);
    return null;
  }
}

// Search students
export async function searchStudents(searchTerm, academicYearId = null) {
  try {
    console.log('🔍 === STUDENT SEARCH DEBUG START ===');
    
    // DEBUG: Check authentication state
    const { data: { session }, error: sessionError } = await supabase?.auth?.getSession();
    console.log('🔐 Auth Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message,
      rawUserMetadata: session?.user?.user_metadata,
      rawAppMetadata: session?.user?.app_metadata
    });

    // DEBUG: Check user profile and role
    if (session?.user?.id) {
      const { data: profile, error: profileError } = await supabase
        ?.from('user_profiles')
        ?.select('id, email, role, is_active')
        ?.eq('id', session?.user?.id)
        ?.single();
      
      console.log('👤 User Profile:', {
        profile,
        profileError: profileError?.message,
        hasAdminAccess: profile?.role === 'admin' || profile?.role === 'owner',
        isActive: profile?.is_active
      });

      // DEBUG: Test RLS helper functions
      const { data: isAdminResult, error: isAdminError } = await supabase
        ?.rpc('is_admin_user');
      console.log('🔑 is_admin_user() result:', { isAdminResult, isAdminError: isAdminError?.message });

      const { data: roleCheckResult, error: roleCheckError } = await supabase
        ?.rpc('check_user_role');
      console.log('🔑 check_user_role() result:', { roleCheckResult, roleCheckError: roleCheckError?.message });
    }

    // Use provided academicYearId or fall back to fetching the current year from DB
    let resolvedAcademicYearId = academicYearId;
    if (!resolvedAcademicYearId) {
      const { data: currentYear } = await supabase
        ?.from('academic_years')
        ?.select('id')
        ?.eq('is_current', true)
        ?.single();
      resolvedAcademicYearId = currentYear?.id;
    }

    // Trim and prepare search term
    const trimmedSearch = searchTerm?.trim();
    if (!trimmedSearch) return [];

    console.log('🔍 Searching for:', trimmedSearch, '| Academic Year ID:', resolvedAcademicYearId);

    // Search students by admission number or name
    const { data: studentData, error: studentError } = await supabase
      ?.from('students')
      ?.select(`
        *,
        classes(id, name, display_name),
        parent_students(
          father_name,
          mother_name,
          father_mobile,
          mother_mobile
        )
      `)
      ?.or(`name.ilike.%${trimmedSearch}%,admission_number.ilike.%${trimmedSearch}%`)
      ?.eq('is_active', true)
      ?.limit(10);

    console.log('📊 Student search query result:', { 
      dataCount: studentData?.length || 0, 
      error: studentError,
      errorCode: studentError?.code,
      errorMessage: studentError?.message,
      errorDetails: studentError?.details
    });

    if (studentError) {
      console.error('❌ Student search error:', studentError);
      if (isSchemaError(studentError)) {
        throw studentError;
      }
      return [];
    }

    // Also search by mobile number in parent_students table
    const { data: parentData, error: parentError } = await supabase
      ?.from('parent_students')
      ?.select(`
        student_id,
        father_name,
        mother_name,
        father_mobile,
        mother_mobile
      `)
      ?.or(`father_mobile.ilike.%${trimmedSearch}%,mother_mobile.ilike.%${trimmedSearch}%`)
      ?.limit(10);

    console.log('📱 Parent search query result:', { 
      dataCount: parentData?.length || 0,
      error: parentError 
    });

    // Get student IDs from parent search
    const studentIdsFromParent = (parentData || [])?.map(p => p?.student_id)?.filter(Boolean);

    // Fetch full student details for parent search results
    let studentsFromParentSearch = [];
    if (studentIdsFromParent?.length > 0) {
      const { data: parentStudents } = await supabase
        ?.from('students')
        ?.select(`
          *,
          classes(id, name, display_name),
          parent_students(
            father_name,
            mother_name,
            father_mobile,
            mother_mobile
          )
        `)
        ?.in('id', studentIdsFromParent)
        ?.eq('is_active', true);
      
      studentsFromParentSearch = parentStudents || [];
    }

    // Combine results from both searches
    const allStudents = [...(studentData || []), ...studentsFromParentSearch];

    // Remove duplicates based on student ID
    const uniqueStudents = allStudents?.filter((student, index, self) =>
      index === self?.findIndex((s) => s?.id === student?.id)
    );

    console.log('Unique students found:', uniqueStudents?.length);

    // Calculate balance for each student using the resolved academic year only
    const studentsWithBalance = await Promise.all(
      uniqueStudents?.map(async (student) => {
        let balance = 0;
        
        if (resolvedAcademicYearId) {
          const { data: balanceData, error: balanceError } = await supabase
            ?.rpc('calculate_student_balance', {
              p_student_id: student?.id,
              p_academic_year_id: resolvedAcademicYearId
            });
          
          if (balanceError) {
            console.error('Balance calculation error for student', student?.id, ':', balanceError);
          }
          balance = balanceData || 0;
        }

        return {
          ...student,
          balance,
          mobile: student?.parent_students?.[0]?.father_mobile || student?.parent_students?.[0]?.mother_mobile || ''
        };
      })
    );

    console.log('Final search results:', studentsWithBalance);

    return toCamelCase(studentsWithBalance);
  } catch (error) {
    console.error('Search students error:', error);
    return [];
  }
}

// Get students by parent ID
export async function getStudentsByParentId(parentId) {
  try {
    const { data, error } = await supabase?.from('parent_students')?.select(`
        *,
        students(*)
      `)?.eq('parent_id', parentId);

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get students by parent ID error:', error);
    return [];
  }
}

// Bulk import students from Excel data
export async function bulkImportStudents(studentsData, academicYearId) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    for (let i = 0; i < studentsData?.length; i++) {
      const row = studentsData?.[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Validate required fields
        if (!row?.admission_number || !row?.student_name || !row?.class || !row?.section) {
          results.failed++;
          results?.errors?.push({
            row: rowNumber,
            admissionNumber: row?.admission_number,
            message: 'Missing required fields (admission_number, student_name, class, or section)'
          });
          continue;
        }

        // Check if student already exists
        const { data: existingStudent } = await supabase
          ?.from('students')
          ?.select('id')
          ?.eq('admission_number', row?.admission_number)
          ?.single();

        if (existingStudent) {
          results.failed++;
          results?.errors?.push({
            row: rowNumber,
            admissionNumber: row?.admission_number,
            message: 'Student with this admission number already exists'
          });
          continue;
        }

        // Prepare student data
        const classText = row?.class?.toString();
        // Resolve class_id from classes master table
        let classId = null;
        try {
          const { data: classRow } = await supabase
            ?.rpc('get_class_id_by_name', { p_class_name: classText });
          classId = classRow || null;
        } catch (_) { /* non-fatal */ }

        const studentData = {
          admission_number: row?.admission_number,
          name: row?.student_name,
          class: classText,
          class_id: classId,
          section: row?.section,
          date_of_birth: row?.date_of_birth,
          date_of_joining: row?.date_of_joining,
          aadhaar_number: row?.aadhaar_number || null,
          community: row?.community || null,
          blood_group: row?.blood_group || null,
          is_active: true
        };

        // Insert student
        const { data: newStudent, error: studentError } = await supabase
          ?.from('students')
          ?.insert([studentData])
          ?.select()
          ?.single();

        if (studentError) {
          results.failed++;
          results?.errors?.push({
            row: rowNumber,
            admissionNumber: row?.admission_number,
            message: studentError?.message || 'Failed to insert student'
          });
          continue;
        }

        // Create parent profile if student inserted successfully
        if (newStudent?.id) {
          // First, create a user profile for the parent
          const { data: parentProfile, error: parentError } = await supabase
            ?.from('user_profiles')
            ?.insert([{
              email: `${row?.admission_number?.toLowerCase()}@parent.school`,
              full_name: row?.father_name,
              role: 'parent'
            }])
            ?.select()
            ?.single();

          if (!parentError && parentProfile?.id) {
            // Then create parent-student relationship
            await supabase?.from('parent_students')?.insert([{
              parent_id: parentProfile?.id,
              student_id: newStudent?.id,
              father_name: row?.father_name,
              mother_name: row?.mother_name,
              father_mobile: row?.mobile_number,
              mother_mobile: row?.mother_mobile || null,
              address: row?.address
            }]);
          }
        }

        results.success++;
      } catch (rowError) {
        console.error(`Error processing row ${rowNumber}:`, rowError);
        results.failed++;
        results?.errors?.push({
          row: rowNumber,
          admissionNumber: row?.admission_number,
          message: rowError?.message || 'Unexpected error occurred'
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Bulk import error:', error);
    throw error;
  }
}
