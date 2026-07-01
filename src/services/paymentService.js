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

// Get payment history for a student
export async function getPaymentHistory(studentId, academicYearId = null) {
  try {
    let query = supabase?.from('payments')?.select(`
        *,
        fee_categories(name),
        academic_years(year_name)
      `)?.eq('student_id', studentId)?.order('payment_date', { ascending: false });

    if (academicYearId) {
      query = query?.eq('academic_year_id', academicYearId);
    }

    const { data, error } = await query;

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get payment history error:', error);
    return [];
  }
}

// Create payment
export async function createPayment(paymentData) {
  try {
    const snakeCaseData = toSnakeCase(paymentData);
    
    const { data, error } = await supabase?.from('payments')?.insert(snakeCaseData)?.select()?.single();

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      throw new Error(error.message);
    }

    return toCamelCase(data);
  } catch (error) {
    console.error('Create payment error:', error);
    throw error;
  }
}

// Create Razorpay payment record
export async function createRazorpayPayment({
  studentId,
  academicYearId,
  term,
  feeCategoryId,
  amount,
  razorpayPaymentId,
  razorpayOrderId,
  receiptNumber,
  recordedBy
}) {
  try {
    const paymentData = {
      studentId,
      academicYearId,
      term,
      feeCategoryId,
      amount,
      paymentMethod: 'online',
      paymentStatus: 'completed',
      transactionId: razorpayPaymentId,
      receiptNumber,
      remarks: `Razorpay Order: ${razorpayOrderId}`,
      recordedBy,
      paymentDate: new Date()?.toISOString()
    };

    return await createPayment(paymentData);
  } catch (error) {
    console.error('Create Razorpay payment error:', error);
    throw error;
  }
}

// Verify Razorpay payment (should be done on server in production)
export async function verifyRazorpayPayment(razorpayPaymentId) {
  try {
    // In production, call your backend API to verify payment with Razorpay
    // This is a placeholder that checks if payment exists in database
    const { data, error } = await supabase?.from('payments')?.select('*')?.eq('transaction_id', razorpayPaymentId)?.single();

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        return null;
      }
      return null;
    }

    return toCamelCase(data);
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    return null;
  }
}

// Get recent payments (for admin dashboard)
export async function getRecentPayments(limit = 10, academicYearId = null) {
  try {
    let query = supabase?.from('payments')?.select(`
        *,
        students(name, admission_number),
        fee_categories(name)
      `)?.order('payment_date', { ascending: false })?.limit(limit);

    if (academicYearId) {
      query = query?.eq('academic_year_id', academicYearId);
    }

    const { data, error } = await query;

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get recent payments error:', error);
    return [];
  }
}

// Get payment statistics
export async function getPaymentStatistics(academicYearId) {
  try {
    // Get total collected
    const { data: completedPayments, error: completedError } = await supabase?.from('payments')?.select('amount')?.eq('academic_year_id', academicYearId)?.eq('payment_status', 'completed');

    if (completedError) {
      if (isSchemaError(completedError)) {
        console.error('Schema error:', completedError?.message);
        throw completedError;
      }
      return { totalCollected: 0, totalPending: 0, totalStudents: 0 };
    }

    const totalCollected = (completedPayments || [])?.reduce((sum, p) => sum + parseFloat(p?.amount), 0);

    // Get total fees
    const { data: feeStructures, error: feeError } = await supabase?.from('fee_structures')?.select('amount')?.eq('academic_year_id', academicYearId);

    if (feeError) {
      if (isSchemaError(feeError)) {
        console.error('Schema error:', feeError?.message);
        throw feeError;
      }
      return { totalCollected, totalPending: 0, totalStudents: 0 };
    }

    const totalFees = (feeStructures || [])?.reduce((sum, f) => sum + parseFloat(f?.amount), 0);
    const totalPending = totalFees - totalCollected;

    // Get total students
    const { count, error: countError } = await supabase?.from('students')?.select('*', { count: 'exact', head: true })?.eq('is_active', true);

    if (countError) {
      if (isSchemaError(countError)) {
        console.error('Schema error:', countError?.message);
        throw countError;
      }
      return { totalCollected, totalPending, totalStudents: 0 };
    }

    return {
      totalCollected,
      totalPending,
      totalStudents: count || 0
    };
  } catch (error) {
    console.error('Get payment statistics error:', error);
    return { totalCollected: 0, totalPending: 0, totalStudents: 0 };
  }
}

// Get payment statistics by mode (Cash vs UPI)
export async function getPaymentStatsByMode(academicYearId) {
  try {
    const { data, error } = await supabase
      ?.from('payments')
      ?.select('amount, payment_method')
      ?.eq('academic_year_id', academicYearId)
      ?.eq('payment_status', 'completed');

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return { cashTotal: 0, upiTotal: 0, onlineTotal: 0, combinedTotal: 0, cashCount: 0, upiCount: 0 };
    }

    const payments = data || [];
    const cashPayments = payments?.filter(p => p?.payment_method === 'cash');
    const upiPayments = payments?.filter(p => p?.payment_method === 'upi');
    const onlinePayments = payments?.filter(p => p?.payment_method === 'online');

    const cashTotal = cashPayments?.reduce((sum, p) => sum + parseFloat(p?.amount || 0), 0);
    const upiTotal = upiPayments?.reduce((sum, p) => sum + parseFloat(p?.amount || 0), 0);
    const onlineTotal = onlinePayments?.reduce((sum, p) => sum + parseFloat(p?.amount || 0), 0);

    return {
      cashTotal,
      upiTotal,
      onlineTotal,
      combinedTotal: cashTotal + upiTotal + onlineTotal,
      cashCount: cashPayments?.length,
      upiCount: upiPayments?.length,
      onlineCount: onlinePayments?.length
    };
  } catch (error) {
    console.error('Get payment stats by mode error:', error);
    return { cashTotal: 0, upiTotal: 0, onlineTotal: 0, combinedTotal: 0, cashCount: 0, upiCount: 0, onlineCount: 0 };
  }
}

// Get UPI payments for verification
export async function getUpiPayments(limit = 20) {
  try {
    const { data, error } = await supabase
      ?.from('payments')
      ?.select(`
        *,
        students(name, admission_number)
      `)
      ?.eq('payment_method', 'upi')
      ?.order('payment_date', { ascending: false })
      ?.limit(limit);

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get UPI payments error:', error);
    return [];
  }
}

// Generate receipt number
export function generateReceiptNumber() {
  const now = new Date();
  const year = now?.getFullYear();
  const timestamp = now?.getTime();
  return `RCP/${year}/${timestamp?.toString()?.slice(-6)}`;
}

// Get online payments for monitor
export async function getOnlinePayments(limit = 20) {
  try {
    const { data, error } = await supabase?.from('payments')?.select(`
        *,
        students(name, admission_number)
      `)
      ?.eq('payment_method', 'online')
      ?.order('payment_date', { ascending: false })
      ?.limit(limit);

    if (error) {
      if (isSchemaError(error)) {
        console.error('Schema error:', error?.message);
        throw error;
      }
      return [];
    }

    return toCamelCase(data || []);
  } catch (error) {
    console.error('Get online payments error:', error);
    return [];
  }
}

// Search payments by term, date range, method, or student name/admission number
export async function searchPayments({ searchTerm, dateFrom, dateTo, paymentMethod } = {}) {
  try {
    let query = supabase?.from('payments')?.select(`
      *,
      students(name, admission_number)
    `);

    if (paymentMethod) {
      query = query?.eq('payment_method', paymentMethod);
    }
    if (dateFrom) {
      query = query?.gte('payment_date', dateFrom);
    }
    if (dateTo) {
      query = query?.lte('payment_date', dateTo + 'T23:59:59');
    }

    query = query?.order('payment_date', { ascending: false })?.limit(100);

    const { data, error } = await query;
    if (error) return [];

    let results = toCamelCase(data || []);

    if (searchTerm) {
      const term = searchTerm?.toLowerCase();
      results = results?.filter(p =>
        p?.receiptNumber?.toLowerCase()?.includes(term) ||
        p?.students?.name?.toLowerCase()?.includes(term) ||
        p?.students?.admissionNumber?.toLowerCase()?.includes(term) ||
        p?.transactionId?.toLowerCase()?.includes(term)
      );
    }

    return results;
  } catch (error) {
    console.error('Search payments error:', error);
    return [];
  }
}
