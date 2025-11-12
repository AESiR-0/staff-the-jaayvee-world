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
  
  // Check if body is FormData
  const isFormData = options?.body instanceof FormData;
  
  const headers = new Headers();
  
  // Copy existing headers (but exclude Content-Type for FormData)
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        // Don't copy Content-Type for FormData - browser will set it with boundary
        if (!isFormData || key.toLowerCase() !== 'content-type') {
          headers.set(key, value);
        }
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        // Don't copy Content-Type for FormData
        if (!isFormData || key.toLowerCase() !== 'content-type') {
          headers.set(key, value);
        }
      });
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        // Don't copy Content-Type for FormData
        if (value !== undefined && value !== null && (!isFormData || key.toLowerCase() !== 'content-type')) {
          headers.set(key, String(value));
        }
      });
    }
  }
  
  // Always add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ Added Authorization header');
  } else {
    console.log('⚠️ No token found in localStorage');
  }
  
  // Set Content-Type only if body exists, not already set, and not FormData
  // FormData needs browser to set Content-Type automatically with boundary
  if (options?.body && !headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  
  try {
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include' as RequestCredentials, // Include cookies (auth-token from server)
      mode: 'cors' as RequestMode, // Explicitly set CORS mode
    };
    
    console.log('📤 Fetch request:', {
      url,
      method: fetchOptions.method || 'GET',
      headers: Object.fromEntries(headers.entries()),
      hasBody: !!fetchOptions.body,
    });
    
    const response = await fetch(url, fetchOptions);
    
    console.log('📥 Fetch response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    
    return response;
  } catch (error: any) {
    // Enhanced error logging for fetch failures
    const errorDetails: any = {
      url,
      method: options?.method || 'GET',
    };
    
    // Try to extract error information
    if (error) {
      if (error.message) errorDetails.message = error.message;
      if (error.name) errorDetails.name = error.name;
      if (error.stack) errorDetails.stack = error.stack;
      if (error.cause) errorDetails.cause = error.cause;
      // Log the full error object
      errorDetails.fullError = error;
    } else {
      errorDetails.note = 'Error object is empty or undefined';
    }
    
    console.error('❌ Fetch error details:', errorDetails);
    console.error('❌ Full error object:', error);
    
    // Re-throw with more context
    const errorMessage = error?.message || error?.toString() || 'Failed to fetch';
    throw new Error(`Network error: ${errorMessage}. URL: ${url}. Check CORS and network connectivity.`);
  }
}

