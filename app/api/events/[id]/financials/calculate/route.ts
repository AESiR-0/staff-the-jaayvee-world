import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route to forward financials calculate requests to jaayvee-world API
 * GET /api/events/[id]/financials/calculate
 */
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
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/financials/calculate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to calculate financials' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying financials calculate request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate financials' },
      { status: 500 }
    );
  }
}

