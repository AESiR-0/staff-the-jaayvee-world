/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Get team session data from localStorage
 */
export function getTeamSession() {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('userSession');
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

// Backward compatibility alias
export const getStaffSession = getTeamSession;

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    // Try to decode JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Not a JWT, might be base64 JSON (staff token)
      try {
        const decoded = atob(token);
        const payload = JSON.parse(decoded);
        if (payload.timestamp) {
          // Staff token: 30 days expiration
          const expirationTime = payload.timestamp + (30 * 24 * 60 * 60 * 1000);
          return Date.now() > expirationTime;
        }
      } catch {
        // Not base64 JSON either
        return true;
      }
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) {
      return true; // No expiration, consider expired
    }
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If we can't parse, consider expired
  }
}

// Flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false;
let logoutPromise: Promise<void> | null = null;

/**
 * Check if user has tasks with deadlines today (same day)
 */
async function hasTodayDeadlines(): Promise<{ hasDeadlines: boolean; count: number; tasks: any[] }> {
  try {
    const token = getAuthToken();
    if (!token) {
      return { hasDeadlines: false, count: 0, tasks: [] };
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
    const response = await fetch(`${API_BASE_URL}/api/team/tasks/today-deadlines`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          hasDeadlines: result.data.hasTodayDeadlines,
          count: result.data.count,
          tasks: result.data.tasks || [],
        };
      }
    }
    return { hasDeadlines: false, count: 0, tasks: [] };
  } catch (error) {
    console.error('Error checking today deadlines:', error);
    return { hasDeadlines: false, count: 0, tasks: [] };
  }
}

/**
 * Logout user by clearing storage and redirecting
 * Uses a singleton pattern to prevent multiple simultaneous logouts
 * Now checks for same-day deadlines before allowing logout
 */
export async function logoutUser(force: boolean = false): Promise<{ allowed: boolean; reason?: string; tasks?: any[] }> {
  // Check for same-day deadlines unless forced
  if (!force) {
    const deadlineCheck = await hasTodayDeadlines();
    if (deadlineCheck.hasDeadlines) {
      return {
        allowed: false,
        reason: `You have ${deadlineCheck.count} task${deadlineCheck.count > 1 ? 's' : ''} with deadline${deadlineCheck.count > 1 ? 's' : ''} today. Please complete them before logging out.`,
        tasks: deadlineCheck.tasks,
      };
    }
  }

  // If already logging out, return the existing promise
  if (isLoggingOut && logoutPromise) {
    await logoutPromise;
    return { allowed: true };
  }

  isLoggingOut = true;
  logoutPromise = (async () => {
    try {
      // Call logout endpoint to clear server-side cookie
      // Try team logout first, fallback to regular logout
      try {
        await fetch('/api/team/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch {
        // Fallback to regular logout if team logout doesn't exist
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } catch {
          // Ignore if both fail
        }
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userSession');
      
      // Delay redirect slightly to allow error handling in calling code
      // This prevents immediate cancellation of pending requests
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
      
      isLoggingOut = false;
      logoutPromise = null;
    }
  })();

  await logoutPromise;
  return { allowed: true };
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  
  console.log('🔐 Making authenticated request to:', url);
  console.log('🔑 Token present:', !!token);
  
  if (!token) {
    // No token, redirect to home
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('No authentication token found');
  }

  // Check if token is expired before making the request
  if (isTokenExpired(token)) {
    console.warn('Token expired, logging out user');
    // Don't await logout - let it happen in background to not block error handling
    logoutUser().catch(() => {});
    throw new Error('Token expired');
  }
  
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
    
    // Check for 401 Unauthorized response (token expired on server)
    if (response.status === 401) {
      console.warn('Received 401 Unauthorized, checking for today deadlines before logout');
      // Check for today's deadlines before auto-logout
      const deadlineCheck = await hasTodayDeadlines();
      if (deadlineCheck.hasDeadlines) {
        // Don't auto-logout if there are same-day deadlines
        console.warn(`401 received but user has ${deadlineCheck.count} task(s) with deadline(s) today. Preventing auto-logout.`);
        throw new Error(`TOKEN_EXPIRED_WITH_TODAY_DEADLINES:${deadlineCheck.count}`);
      }
      // No same-day deadlines, proceed with logout
      logoutUser(true).catch(() => {});
      throw new Error('Token expired');
    }
    
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


