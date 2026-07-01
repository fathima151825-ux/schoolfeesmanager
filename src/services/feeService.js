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

// ============================================================
// CLASSES MASTER TABLE
// ============================================================

/**
 * Get all active classes ordered by sort_order.
 * Returns: [{ id, name, displayName, sortOrder, isActive }]
 */
export async function getClasses() {
  try {
    const { data, error } = await supabase
      ?.from('classes')
      ?.select('*')
      ?.eq('is_active', true)
      ?.order('sort_order', { ascending: true });

    if (error) {
      if (isSchemaError(error)) throw error;
      console.error('getClasses error:', error);
      return [];
    }
    return toCamelCase(data || []);
  } catch (error) {
    console.error('getClasses error:', error);
    return [];
  }
}

/**
 * Resolve a class_id UUID from a text class name (e.g. "10", "X", "Class X").
 * Uses the DB helper function for consistent mapping.
 * Returns UUID string or null.
 */
export async function resolveClassId(className) {
  if (!className) return null;
  try {
    const { data, error } = await supabase
      ?.rpc('get_class_id_by_name', { p_class_name: className });
    if (error) {
      console.error('resolveClassId error:', error);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error('resolveClassId error:', error);
    return null;
  }
}

// ============================================================
// FEE STRUCTURE (per student — legacy, kept for balance calc)
// ============================================================

// Get fee structure for a student
export async function getStudentFeeStructure(studentId, academicYearId) {
  try {
    const { data, error } = await supabase?.from('fee_structures')?.select(`
        *,
        fee_categories(name, description)
      `)?.eq('student_id', studentId)?.eq('academic_year_id', academicYearId)?.order('term', { ascending: true });

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get student fee structure error:', error);
    return [];
  }
}

// Get fee categories
export async function getFeeCategories() {
  try {
    const { data, error } = await supabase?.from('fee_categories')?.select('*')?.eq('is_active', true)?.order('name', { ascending: true });

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get fee categories error:', error);
    return [];
  }
}

// Get academic years
export async function getAcademicYears() {
  try {
    // Check if today is April 1st and auto-create next academic year if needed
    await ensureCurrentAcademicYear();

    console.log('[feeService] Fetching academic years from database...');
    const { data, error } = await supabase?.from('academic_years')?.select('*')?.order('start_date', { ascending: false });

    console.log('[feeService] Academic years query response:', { data, error });
    
    if (error) {
      console.error('[feeService] Academic years query error:', error);
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    const camelCasedData = toCamelCase(data || []);
    console.log('[feeService] Academic years after camelCase conversion:', camelCasedData);
    return camelCasedData;
  } catch (error) {
    console.error('Get academic years error:', error);
    return [];
  }
}

// Auto-create academic year on April 1st if it doesn't exist
export async function ensureCurrentAcademicYear() {
  try {
    const today = new Date();
    const month = today?.getMonth() + 1; // 1-indexed
    const day = today?.getDate();

    // Determine the current academic year name (April 1 to March 31)
    const year = today?.getFullYear();
    let currentYearName;
    if (month >= 4) {
      currentYearName = `${year}-${year + 1}`;
    } else {
      currentYearName = `${year - 1}-${year}`;
    }

    // Check if this academic year already exists
    const { data: existing } = await supabase
      ?.from('academic_years')
      ?.select('id')
      ?.eq('year_name', currentYearName)
      ?.maybeSingle();

    if (!existing) {
      // Create the missing academic year
      const startYear = month >= 4 ? year : year - 1;
      const endYear = startYear + 1;
      const startDate = `${startYear}-04-01`;
      const endDate = `${endYear}-03-31`;

      await supabase?.from('academic_years')?.insert({
        year_name: currentYearName,
        start_date: startDate,
        end_date: endDate,
        is_current: true
      });

      // Mark all other years as not current
      await supabase
        ?.from('academic_years')
        ?.update({ is_current: false })
        ?.neq('year_name', currentYearName);

      console.log(`[feeService] Auto-created academic year: ${currentYearName}`);
    } else if (month === 4 && day === 1) {
      // On April 1st, ensure this year is marked as current
      await supabase
        ?.from('academic_years')
        ?.update({ is_current: true })
        ?.eq('year_name', currentYearName);

      await supabase
        ?.from('academic_years')
        ?.update({ is_current: false })
        ?.neq('year_name', currentYearName);
    }
  } catch (error) {
    console.error('[feeService] ensureCurrentAcademicYear error:', error);
    // Non-fatal: continue even if this fails
  }
}

// Get current academic year
export async function getCurrentAcademicYear() {
  try {
    const { data, error } = await supabase?.from('academic_years')?.select('*')?.eq('is_current', true)?.single();

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return null;
    }

    return toCamelCase(data);
  } catch (error) {
    console.error('Get current academic year error:', error);
    return null;
  }
}

// Calculate fee summary for a student
export async function calculateFeeSummary(studentId, academicYearId) {
  try {
    // Get total fees
    const { data: feeData, error: feeError } = await supabase?.from('fee_structures')?.select('amount')?.eq('student_id', studentId)?.eq('academic_year_id', academicYearId);

    if (feeError) {
      if (isSchemaError(feeError)) {
        console.error('Schema error:', feeError?.message);
        throw feeError;
      }
      return { totalFees: 0, paidAmount: 0, outstandingBalance: 0 };
    }

    const totalFees = (feeData || [])?.reduce((sum, fee) => sum + parseFloat(fee?.amount), 0);

    // Get total paid
    const { data: paymentData, error: paymentError } = await supabase?.from('payments')?.select('amount')?.eq('student_id', studentId)?.eq('academic_year_id', academicYearId)?.eq('payment_status', 'completed');

    if (paymentError) {
      if (isSchemaError(paymentError)) {
        console.error('Schema error:', paymentError?.message);
        throw paymentError;
      }
      return { totalFees, paidAmount: 0, outstandingBalance: totalFees };
    }

    const paidAmount = (paymentData || [])?.reduce((sum, payment) => sum + parseFloat(payment?.amount), 0);

    return {
      totalFees,
      paidAmount,
      outstandingBalance: totalFees - paidAmount
    };
  } catch (error) {
    console.error('Calculate fee summary error:', error);
    return { totalFees: 0, paidAmount: 0, outstandingBalance: 0 };
  }
}

// ============================================================
// CLASS FEE STRUCTURES (per class, not per student)
// ============================================================

/**
 * Get fee structure for a specific class and academic year.
 * Accepts either a class_id (UUID) or a class name string.
 * Always resolves to class_id for the DB query — never text-matches.
 */
export async function getClassFeeStructure(classIdOrName, academicYearId) {
  try {
    if (!classIdOrName || !academicYearId) return [];

    // Determine if we have a UUID or a name string
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i?.test(classIdOrName);
    let classId = isUUID ? classIdOrName : null;

    if (!classId) {
      // Resolve text name → UUID via DB function
      classId = await resolveClassId(classIdOrName);
    }

    if (!classId) {
      console.warn(`[getClassFeeStructure] Could not resolve class_id for: "${classIdOrName}"`);
      return [];
    }

    const { data, error } = await supabase
      ?.from('class_fee_structures')
      ?.select(`
        *,
        fee_categories(id, name, description),
        classes(id, name, display_name)
      `)
      ?.eq('class_id', classId)
      ?.eq('academic_year_id', academicYearId)
      ?.order('term', { ascending: true });

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        return [];
      }
      console.error('getClassFeeStructure error:', error);
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('getClassFeeStructure error:', error);
    return [];
  }
}

/**
 * Get all class fee structures for an academic year (admin view).
 */
export async function getAllClassFeeStructures(academicYearId) {
  try {
    const { data, error } = await supabase
      ?.from('class_fee_structures')
      ?.select(`
        *,
        fee_categories(id, name, description),
        academic_years(id, year_name),
        classes(id, name, display_name, sort_order)
      `)
      ?.eq('academic_year_id', academicYearId)
      ?.order('term', { ascending: true });

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        return [];
      }
      console.error('getAllClassFeeStructures error:', error);
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('getAllClassFeeStructures error:', error);
    return [];
  }
}

/**
 * Upsert (insert or update) a class fee structure entry.
 * Accepts classId (UUID) — never a text class name.
 */
export async function upsertClassFeeStructure({ classId, className, academicYearId, term, feeCategoryId, amount, dueDate }) {
  try {
    // Resolve classId if only className provided (backward compat)
    let resolvedClassId = classId;
    if (!resolvedClassId && className) {
      resolvedClassId = await resolveClassId(className);
    }
    if (!resolvedClassId) throw new Error(`Cannot resolve class_id for: "${className}"`);

    const { data, error } = await supabase
      ?.from('class_fee_structures')
      ?.upsert({
        class_name: className || null,
        class_id: resolvedClassId,
        academic_year_id: academicYearId,
        term,
        fee_category_id: feeCategoryId,
        amount: parseFloat(amount) || 0,
        due_date: dueDate || null,
        updated_at: new Date()?.toISOString()
      }, {
        onConflict: 'class_id,academic_year_id,term,fee_category_id'
      })
      ?.select()
      ?.single();

    if (error) {
      console.error('upsertClassFeeStructure error:', error);
      throw error;
    }

    return toCamelCase(data);
  } catch (error) {
    console.error('upsertClassFeeStructure error:', error);
    throw error;
  }
}

/**
 * Delete a class fee structure entry.
 */
export async function deleteClassFeeStructure(id) {
  try {
    const { error } = await supabase
      ?.from('class_fee_structures')
      ?.delete()
      ?.eq('id', id);

    if (error) {
      console.error('deleteClassFeeStructure error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('deleteClassFeeStructure error:', error);
    throw error;
  }
}

/**
 * Bulk upsert fee structures for a class (all terms and categories at once).
 * classId: UUID from classes master table.
 * entries: [{ term, feeCategoryId, amount, dueDate }]
 */
export async function bulkUpsertClassFeeStructures(classId, academicYearId, entries, className) {
  try {
    // Resolve classId if only className provided (backward compat)
    let resolvedClassId = classId;
    if (!resolvedClassId && className) {
      resolvedClassId = await resolveClassId(className);
    }
    if (!resolvedClassId) throw new Error(`Cannot resolve class_id for: "${className}"`);

    const rows = entries?.map(e => ({
      class_name: className || null,
      class_id: resolvedClassId,
      academic_year_id: academicYearId,
      term: e?.term,
      fee_category_id: e?.feeCategoryId,
      amount: parseFloat(e?.amount) || 0,
      due_date: e?.dueDate || null,
      updated_at: new Date()?.toISOString()
    }));

    const { data, error } = await supabase
      ?.from('class_fee_structures')
      ?.upsert(rows, {
        onConflict: 'class_id,academic_year_id,term,fee_category_id'
      })
      ?.select();

    if (error) {
      console.error('bulkUpsertClassFeeStructures error:', error);
      throw error;
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('bulkUpsertClassFeeStructures error:', error);
    throw error;
  }
}
