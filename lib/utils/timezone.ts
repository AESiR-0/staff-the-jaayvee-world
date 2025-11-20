/**
 * Timezone utility functions for consistent date handling
 * Ensures dates are stored in UTC and displayed in IST (Asia/Kolkata)
 * 
 * The application uses IST (UTC+5:30) as the standard timezone for user input/output
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

/**
 * Converts a UTC Date to datetime-local string format (YYYY-MM-DDTHH:mm)
 * Converts from UTC to IST for display (what the user sees)
 * @param utcDate - Date object in UTC (from database)
 * @returns String in format "YYYY-MM-DDTHH:mm" (for datetime-local input)
 */
export function utcToDateTimeLocal(utcDate: Date | string | null): string {
  if (!utcDate) {
    return '';
  }

  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Convert UTC to IST by adding the offset
  const istTime = date.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);

  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

