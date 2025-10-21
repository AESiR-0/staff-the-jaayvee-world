import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, faceImageUrl } = body;

    if (!staffId || !faceImageUrl) {
      return NextResponse.json(
        { success: false, message: 'Staff ID and face image are required' },
        { status: 400 }
      );
    }

    // Mock response - always successful for demo
    return NextResponse.json({
      success: true,
      message: 'Face verification successful',
      token: `demo_token_${Date.now()}`,
      staff: {
        id: staffId,
        displayName: 'Demo Staff',
        affiliateCode: 'TJ2024-DEMO-001'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
