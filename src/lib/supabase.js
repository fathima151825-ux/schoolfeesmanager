import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to check if error is schema-related
export function isSchemaError(error) {
  if (!error) return false;
  
  // Check PostgreSQL error code class (first 2 characters)
  if (error?.code && typeof error?.code === 'string') {
    const errorClass = error?.code?.substring(0, 2);
    
    // Class 42 = Schema errors (syntax, undefined table/column, etc.)
    if (errorClass === '42') {
      return true;
    }
    
    // Class 08 = Connection errors - treat as schema/system errors
    if (errorClass === '08') {
      return true;
    }
  }
  
  // Fallback: Check error message patterns for schema issues
  if (error?.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
      /invalid.*syntax/i,
      /type.*does not exist/i,
      /undefined.*column/i,
      /undefined.*table/i,
      /undefined.*function/i,
    ];
    
    return schemaErrorPatterns?.some(pattern => pattern?.test(error?.message));
  }
  
  return false;
}
