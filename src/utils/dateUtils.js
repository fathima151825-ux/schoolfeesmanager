/**
 * Date utility functions for DD/MM/YYYY format
 */

/**
 * Validates a date string in DD/MM/YYYY format
 * @param {string} dateStr - Date string to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateDDMMYYYY(dateStr) {
  if (!dateStr || dateStr?.trim() === '') {
    return { valid: false, error: 'Date is required' };
  }

  const trimmed = dateStr?.trim();
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = trimmed?.match(regex);

  if (!match) {
    return { valid: false, error: 'Please enter date in DD/MM/YYYY format (e.g. 15/05/2015)' };
  }

  const day = parseInt(match?.[1], 10);
  const month = parseInt(match?.[2], 10);
  const year = parseInt(match?.[3], 10);

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month. Please use DD/MM/YYYY format' };
  }

  const daysInMonth = new Date(year, month, 0)?.getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, error: `Invalid day for the given month. Please use DD/MM/YYYY format` };
  }

  if (year < 1900 || year > 2100) {
    return { valid: false, error: 'Invalid year. Please use DD/MM/YYYY format' };
  }

  return { valid: true, error: null };
}

/**
 * Converts a DB date (YYYY-MM-DD or ISO string) to DD/MM/YYYY display format
 * @param {string} dbDate - Date from database
 * @returns {string} Formatted date string in DD/MM/YYYY or empty string
 */
export function formatDateToDDMMYYYY(dbDate) {
  if (!dbDate) return '';

  // Already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/?.test(dbDate)) return dbDate;

  try {
    // Handle ISO string or YYYY-MM-DD
    const date = new Date(dbDate);
    if (isNaN(date?.getTime())) return dbDate;

    const day = String(date?.getUTCDate())?.padStart(2, '0');
    const month = String(date?.getUTCMonth() + 1)?.padStart(2, '0');
    const year = date?.getUTCFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return dbDate;
  }
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD for database storage
 * @param {string} ddmmyyyy - Date in DD/MM/YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
export function convertToDBFormat(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy?.split('/');
  if (parts?.length !== 3) return ddmmyyyy;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}
