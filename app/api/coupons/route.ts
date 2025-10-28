import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI, API_ENDPOINTS } from '@/lib/api';

// GET - Fetch all coupons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Proxy the request to the central API
    const response = await fetchAPI(`${API_ENDPOINTS.COUPONS}${status ? `?status=${status}` : ''}`, {
      method: 'GET',
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the central API
    const response = await fetchAPI(API_ENDPOINTS.COUPONS, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to create coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a coupon
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Proxy the request to the central API
    const response = await fetchAPI(`${API_ENDPOINTS.COUPONS}?id=${id}`, {
      method: 'DELETE',
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to delete coupon:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}