import { NextResponse } from 'next/server';
import { fetchAPI, API_ENDPOINTS } from '@/lib/api';

export async function GET() {
  try {
    // Proxy the request to the central API
    const response = await fetchAPI(API_ENDPOINTS.TALAASH_EVENTS_SUMMARY, {
      method: 'GET',
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}