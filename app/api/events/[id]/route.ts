import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy routes to forward event requests to jaayvee-world API
 * GET /api/events/[id] - Get event
 * PUT /api/events/[id] - Update event
 * DELETE /api/events/[id] - Delete event
 */

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch event' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying event GET request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update event' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying event PUT request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to delete event' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying event DELETE request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}

