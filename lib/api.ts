// API configuration - Always use production API
const API_BASE_URL = 'https://talaash.thejaayveeworld.com';

// You can also use environment variables:
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Authentication
  AUTH_INITIATE: `${API_BASE_URL}/api/staff/auth/initiate`,
  AUTH_VERIFY: `${API_BASE_URL}/api/staff/auth/verify`,
  
  // Staff Affiliates
  STAFF_AFFILIATE_CREATE: `${API_BASE_URL}/api/staff/affiliate`,
  STAFF_AFFILIATE_GET: `${API_BASE_URL}/api/staff/affiliate`,
  
  // Talaash Events
  TALAASH_EVENTS_SUMMARY: `${API_BASE_URL}/api/talaash/events/summary`,
  
  // QR Management
  QR_GENERATE: `${API_BASE_URL}/api/staff/qr/generate`,
  QR_ASSIGN_RANGE: `${API_BASE_URL}/api/staff/qr/assign-range`,
} as const;

// Helper function to make API calls
export async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
