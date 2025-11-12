// API Configuration
// The notifications API is on the main site (jaayvee-world), not the staff portal
// For local development: If main API is running on localhost:3000, set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
// For production: Uses talaash.thejaayveeworld.com or set NEXT_PUBLIC_API_BASE_URL
function getApiBaseUrl(): string {
  // If explicitly set in env, use it (highest priority)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Default to production API
  // Note: For localhost development, you need to set NEXT_PUBLIC_API_BASE_URL in .env.local
  // Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 (if main API runs there)
  return 'https://talaash.thejaayveeworld.com';
}

// API_BASE_URL should point to the main site (jaayvee-world) where notifications API is hosted
// For local dev: Set NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 in .env.local
// For production: Defaults to talaash (staff portal API) - notifications API is on main site
// Note: Notifications API is on the main site, so if using talaash, you need to set NEXT_PUBLIC_API_BASE_URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

export const API_ENDPOINTS = {
  // Staff Auth (backend routes remain as staff)
  STAFF_AUTH_LOGIN: '/api/staff/auth/login',
  STAFF_AUTH_REGISTER: '/api/staff/auth/register',
  STAFF_AUTH_INITIATE: '/api/staff/auth/initiate',
  STAFF_AUTH_VERIFY: '/api/staff/auth/verify',
  
  // QR Tools
  QR_GENERATE: '/api/staff/qr/generate',
  QR_ASSIGN_RANGE: '/api/staff/qr/assign-range',
  QR_ASSIGNMENTS: '/api/staff/qr/assignments',
  QR_HISTORY: '/api/staff/qr/history',
  
  // Agents
  AGENTS: '/api/agents',
  SEED_AGENTS: '/api/seed/agents',
  
  // Affiliates
  STAFF_AFFILIATE: '/api/staff/affiliate',
  STAFF_AFFILIATES_STATS: '/api/staff/affiliates/stats',
  
  // Events
  TALAASH_EVENTS_SUMMARY: '/api/talaash/events/summary',
  
  // Coupons
  COUPONS: '/api/coupons',
  COUPONS_VALIDATE: '/api/coupons/validate',
  
  // Sellers
  CREATE_SELLER: '/api/staff/sellers/create',
};

export const fetchAPI = async <T = any>(endpoint: string, options?: RequestInit): Promise<T> => {
  try {
    console.log(`🌐 Making API request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Include cookies in cross-origin requests
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error response:`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API success:`, data);
    return data;
  } catch (error) {
    console.error(`❌ API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Alias for backward compatibility
export const apiCall = fetchAPI;

// Helper function for staff login (backend uses staff, frontend shows team)
export const staffLogin = async (email: string, password: string) => {
  return fetchAPI(API_ENDPOINTS.STAFF_AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

// Helper function for staff register (backend uses staff, frontend shows team)
export const staffRegister = async (fullName: string, email: string, password: string, phone?: string) => {
  return fetchAPI(API_ENDPOINTS.STAFF_AUTH_REGISTER, {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, phone }),
  });
};

// Frontend aliases for team terminology (UI only)
export const teamLogin = staffLogin;
export const teamRegister = staffRegister;