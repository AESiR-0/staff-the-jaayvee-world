import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, API_ENDPOINTS } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Proxy the request to the central API
    const response = await fetchAPI(API_ENDPOINTS.TEAM_AFFILIATE, {
      method: 'GET',
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Affiliate GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the central API
    const response = await fetchAPI(API_ENDPOINTS.TEAM_AFFILIATE, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Affiliate POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create affiliate' },
      { status: 500 }
    );
  }
}
