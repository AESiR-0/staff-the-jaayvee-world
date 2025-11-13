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
  // Team Auth
  TEAM_AUTH_LOGIN: '/api/team/auth/login',
  TEAM_AUTH_REGISTER: '/api/team/auth/register',
  TEAM_AUTH_INITIATE: '/api/team/auth/initiate',
  TEAM_AUTH_VERIFY: '/api/team/auth/verify',
  
  // QR Tools
  QR_GENERATE: '/api/team/qr/generate',
  QR_ASSIGN_RANGE: '/api/team/qr/assign-range',
  QR_ASSIGNMENTS: '/api/team/qr/assignments',
  QR_HISTORY: '/api/team/qr/history',
  
  // Agents
  AGENTS: '/api/agents',
  SEED_AGENTS: '/api/seed/agents',
  
  // Affiliates
  TEAM_AFFILIATE: '/api/team/affiliate',
  TEAM_AFFILIATES_STATS: '/api/team/affiliates/stats',
  
  // Events
  TALAASH_EVENTS_SUMMARY: '/api/talaash/events/summary',
  
  // Coupons
  COUPONS: '/api/coupons',
  COUPONS_VALIDATE: '/api/coupons/validate',
  
  // Sellers
  CREATE_SELLER: '/api/team/sellers/create',
  
  // CSV Lists
  CSV_LISTS: '/api/csv-lists',
  CSV_LISTS_COMBINE: '/api/csv-lists/combine',
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

// Helper function for team login
export const teamLogin = async (email: string, password: string) => {
  return fetchAPI(API_ENDPOINTS.TEAM_AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

// Helper function for team register
export const teamRegister = async (fullName: string, email: string, password: string, phone?: string) => {
  return fetchAPI(API_ENDPOINTS.TEAM_AUTH_REGISTER, {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, phone }),
  });
};

// Backward compatibility aliases
export const staffLogin = teamLogin;
export const staffRegister = teamRegister;
