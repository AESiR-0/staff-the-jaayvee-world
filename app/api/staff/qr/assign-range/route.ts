import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prefix, startFrom, count } = body;

    if (!prefix || !startFrom || !count) {
      return NextResponse.json(
        { error: 'Prefix, startFrom, and count are required' },
        { status: 400 }
      );
    }

    // Mock assignment - just return success
    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${count} QR codes with prefix ${prefix} starting from ${startFrom}`,
      assignedRange: {
        prefix,
        startFrom,
        count,
        endNumber: startFrom + count - 1
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to assign QR code range' },
      { status: 500 }
    );
  }
}
