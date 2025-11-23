import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy routes to forward share message requests to jaayvee-world API
 * GET /api/events/[id]/share-messages - Get share messages
 * POST /api/events/[id]/share-messages - Create/update share messages
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
    
    // Get query params (platform)
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    
    // Build URL with query params
    let url = `${API_BASE_URL}/api/events/${eventId}/share-messages`;
    if (platform) {
      url += `?platform=${platform}`;
    }
    
    // Forward the request to jaayvee-world API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch share messages' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying share messages GET request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch share messages' },
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
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/share-messages`, {
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
        { success: false, error: data.error || 'Failed to save share message' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying share messages POST request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save share message' },
      { status: 500 }
    );
  }
}

