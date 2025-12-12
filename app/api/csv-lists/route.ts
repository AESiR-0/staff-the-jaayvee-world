import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

// Helper to get auth token from request
function getAuthTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  // Try cookie
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    return token;
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/team/csv-lists${queryString ? `?${queryString}` : ''}`;
    
    const token = getAuthTokenFromRequest(request);
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Forward cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('CSV lists GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CSV lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const token = getAuthTokenFromRequest(request);
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Forward cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    // Don't set Content-Type for FormData - let fetch set it with boundary
    const response = await fetch(`${API_BASE_URL}/api/team/csv-lists`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    
    const data = await response.json();
    
    // Log detailed error information for 400 responses
    if (response.status === 400) {
      console.error('❌ CSV creation failed with 400:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value
        }))
      });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('CSV lists POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CSV list' },
      { status: 500 }
    );
  }
}

