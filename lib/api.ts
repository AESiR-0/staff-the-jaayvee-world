// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Staff Auth
  STAFF_AUTH_LOGIN: '/api/staff/auth/login',
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

// Helper function for staff login
export const staffLogin = async (email: string, password: string) => {
  return fetchAPI(API_ENDPOINTS.STAFF_AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};