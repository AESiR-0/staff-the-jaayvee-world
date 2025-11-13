import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, API_ENDPOINTS } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the central API
    const response = await fetchAPI(API_ENDPOINTS.TEAM_AUTH_VERIFY, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Staff auth verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
