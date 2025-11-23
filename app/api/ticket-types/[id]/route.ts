import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy routes to forward ticket-type requests to jaayvee-world API
 * PATCH /api/ticket-types/[id] - Update ticket type
 * DELETE /api/ticket-types/[id] - Delete ticket type
 */

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the jaayvee-world API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.JAAYVEE_WORLD_API_URL || 'https://talaash.thejaayveeworld.com';
    
    // Get Authorization header from incoming request
    const authHeader = request.headers.get('authorization');
    
    // Get request body
    const body = await request.json();
    
    // Forward the request to jaayvee-world API
    const response = await fetch(`${API_BASE_URL}/api/ticket-types/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to update ticket type' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying ticket type PATCH request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ticket type' },
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
    
    // Get the jaayvee-world API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.JAAYVEE_WORLD_API_URL || 'https://talaash.thejaayveeworld.com';
    
    // Get Authorization header from incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to jaayvee-world API
    const response = await fetch(`${API_BASE_URL}/api/ticket-types/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to delete ticket type' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying ticket type DELETE request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete ticket type' },
      { status: 500 }
    );
  }
}

