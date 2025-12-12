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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getAuthTokenFromRequest(request);
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/api/team/csv-lists/${id}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('CSV list GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CSV list' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getAuthTokenFromRequest(request);
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Check if this is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    let body;

    if (contentType.includes('multipart/form-data')) {
      // FormData request (CSV file upload)
      body = await request.formData();
      // Don't set Content-Type for FormData - let fetch set it with boundary
    } else {
      // JSON request (metadata only)
      headers['Content-Type'] = 'application/json';
      const jsonBody = await request.json();
      body = JSON.stringify(jsonBody);
    }

    const response = await fetch(`${API_BASE_URL}/api/team/csv-lists/${id}`, {
      method: 'PUT',
      headers,
      body,
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('CSV list PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update CSV list' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getAuthTokenFromRequest(request);
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/api/team/csv-lists/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('CSV list DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete CSV list' },
      { status: 500 }
    );
  }
}

