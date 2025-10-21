import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName } = body;

    if (!displayName) {
      return NextResponse.json(
        { success: false, message: 'Display name is required' },
        { status: 400 }
      );
    }

    // Mock response - always successful
    return NextResponse.json({
      success: true,
      message: 'Authentication initiated successfully',
      staffId: `staff_${Date.now()}`,
      requiresVerification: true
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
