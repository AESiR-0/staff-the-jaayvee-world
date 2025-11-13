import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

// Helper to get auth token from request
function getAuthTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  const token = request.cookies.get('auth-token')?.value;
  return token || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = getAuthTokenFromRequest(request);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/team/csv-lists/combine`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('CSV combine error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to combine CSV lists' },
      { status: 500 }
    );
  }
}

