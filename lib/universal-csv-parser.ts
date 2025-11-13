/**
 * Universal CSV Parser for Sales
 * Parses CSV files with any columns - no restrictions
 */

export interface UniversalCSVRow {
  [key: string]: string | null;
}

export interface UniversalCSVParseResult {
  rows: UniversalCSVRow[];
  headers: string[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse CSV text with any columns
 * Returns headers and rows as objects
 */
export function parseUniversalCSV(csvText: string): UniversalCSVParseResult {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const rows: UniversalCSVRow[] = [];
  const errors: string[] = [];
  let totalRows = 0;
  let validRows = 0;
  let headers: string[] = [];

  if (lines.length === 0) {
    return {
      rows: [],
      headers: [],
      errors: ['CSV file is empty'],
      totalRows: 0,
      validRows: 0,
    };
  }

  // First line is headers
  headers = parseCSVLine(lines[0]);
  
  // Remove empty headers
  headers = headers.filter(h => h.trim().length > 0);

  if (headers.length === 0) {
    return {
      rows: [],
      headers: [],
      errors: ['No headers found in CSV'],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    totalRows++;
    const line = lines[i];
    
    // Parse CSV line (handle quoted values)
    const columns = parseCSVLine(line);
    
    if (columns.length === 0) {
      continue;
    }

    // Create row object
    const row: UniversalCSVRow = {};
    let hasData = false;

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = columns[j]?.trim() || null;
      row[header] = value;
      if (value) {
        hasData = true;
      }
    }

    // Only add row if it has at least one non-empty value
    if (hasData) {
      rows.push(row);
      validRows++;
    }
  }

  return {
    rows,
    headers,
    errors,
    totalRows,
    validRows,
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
 * Convert rows back to CSV format
 */
export function rowsToCSV(headers: string[], rows: UniversalCSVRow[]): string {
  const csvLines: string[] = [];
  
  // Add headers
  csvLines.push(headers.map(h => `"${h}"`).join(','));
  
  // Add rows
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes in values
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvLines.push(values.join(','));
  }
  
  return csvLines.join('\n');
}

