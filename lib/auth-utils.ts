/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Get staff session data from localStorage
 * (Backend uses staff, but frontend UI shows team)
 */
export function getStaffSession() {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('userSession');
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

// Frontend alias for team terminology (UI only)
export const getTeamSession = getStaffSession;

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  
  console.log('🔐 Making authenticated request to:', url);
  console.log('🔑 Token present:', !!token);
  
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ Added Authorization header');
  } else {
    console.log('⚠️ No token found in localStorage');
  }
  
  // Set Content-Type only if body exists and not already set
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Include cookies (auth-token from server)
  });
}

