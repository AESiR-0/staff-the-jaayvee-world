/**
 * CSV Parser for WhatsApp Bulk Messaging
 * Parses CSV files with phone and name columns
 * Converts Indian phone numbers to international format
 */

export interface Contact {
  phone: string;
  name: string | null;
}

export interface ParseResult {
  contacts: Contact[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse CSV text and extract contacts
 * Expected format: phone, name (or just phone)
 */
export function parseCSV(csvText: string): ParseResult {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const contacts: Contact[] = [];
  const errors: string[] = [];
  let totalRows = 0;
  let validRows = 0;

  // Skip header row if present
  let startIndex = 0;
  if (lines.length > 0) {
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('phone') || firstLine.includes('name') || firstLine.includes('number')) {
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    totalRows++;
    const line = lines[i];
    
    // Parse CSV line (handle quoted values)
    const columns = parseCSVLine(line);
    
    if (columns.length === 0) {
      continue;
    }

    const phoneRaw = columns[0]?.trim() || '';
    const name = columns[1]?.trim() || null;

    if (!phoneRaw) {
      errors.push(`Row ${i + 1}: Missing phone number`);
      continue;
    }

    // Format phone number
    const formattedPhone = formatIndianPhoneNumber(phoneRaw);
    
    if (!formattedPhone) {
      errors.push(`Row ${i + 1}: Invalid phone number "${phoneRaw}"`);
      continue;
    }

    contacts.push({
      phone: formattedPhone,
      name: name || null
    });
    validRows++;
  }

  return {
    contacts,
    errors,
    totalRows,
    validRows
  };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Format Indian phone number to international format
 * Input: 9876543210, 98765 43210, +91 98765 43210, etc.
 * Output: +919876543210
 */
export function formatIndianPhoneNumber(phone: string): string | null {
  // Remove all spaces, dashes, parentheses, and other non-digit characters except +
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Remove leading 91 if present (country code)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Validate: must be exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return null;
  }
  
  // Return in international format
  return `+91${cleaned}`;
}

/**
 * Validate phone number format
 */
export function isValidIndianPhone(phone: string): boolean {
  return formatIndianPhoneNumber(phone) !== null;
}


