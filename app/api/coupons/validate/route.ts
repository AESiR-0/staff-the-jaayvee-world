import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, API_ENDPOINTS } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the central API
    const response = await fetchAPI(API_ENDPOINTS.COUPONS_VALIDATE, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to validate coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
