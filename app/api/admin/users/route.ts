import { NextRequest, NextResponse } from 'next/server';

/**
 * Helper to extract auth token from request
 */
function getAuthTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try cookie
  const cookieToken = request.cookies.get('authToken')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

/**
 * Proxy route for /api/admin/users
 * Forwards requests to the main API (jaayvee-world)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the search params from the request
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Forward the request to the main API
    const mainApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
    const url = `${mainApiUrl}/api/admin/users${queryString ? `?${queryString}` : ''}`;
    
    // Get auth token from request
    const token = getAuthTokenFromRequest(request);
    
    // Forward cookies from the original request
    const cookieHeader = request.headers.get('cookie') || '';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from main API:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying users request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

