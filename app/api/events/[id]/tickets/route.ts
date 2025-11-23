import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy routes to forward ticket requests to jaayvee-world API
 * GET /api/events/[id]/tickets - Get ticket types
 * POST /api/events/[id]/tickets - Create ticket types
 */

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // Get the jaayvee-world API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.JAAYVEE_WORLD_API_URL || 'https://talaash.thejaayveeworld.com';
    
    // Get Authorization header from incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to jaayvee-world API
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/tickets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch ticket types' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying ticket GET request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ticket types' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // Get the jaayvee-world API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.JAAYVEE_WORLD_API_URL || 'https://talaash.thejaayveeworld.com';
    
    // Get Authorization header from incoming request
    const authHeader = request.headers.get('authorization');
    
    // Get request body
    const body = await request.json();
    
    // Forward the request to jaayvee-world API
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.details || 'Failed to create ticket types' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying ticket creation request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ticket types' },
      { status: 500 }
    );
  }
}

