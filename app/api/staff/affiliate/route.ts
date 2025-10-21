import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock affiliate data
    const affiliateStats = {
      affiliateCode: 'TJ2024-DEMO-001',
      totalClicks: 156,
      totalSignups: 23,
      totalCommission: 1250.50,
      recentClicks: 12,
      recentSignups: 3
    };

    return NextResponse.json(affiliateStats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock affiliate creation
    return NextResponse.json({
      success: true,
      message: 'Affiliate created successfully',
      affiliateCode: `TJ2024-${Date.now().toString().slice(-6)}`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create affiliate' },
      { status: 500 }
    );
  }
}
