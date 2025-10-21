import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prefix, startFrom, count } = body;

    // Mock QR generation - create a simple text file instead of actual QR codes
    const qrData = [];
    for (let i = 0; i < count; i++) {
      qrData.push(`${prefix}-${String(startFrom + i).padStart(4, '0')}`);
    }

    const content = qrData.join('\n');
    const buffer = Buffer.from(content, 'utf-8');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="qr_codes_${prefix}_${startFrom}-${startFrom + count - 1}.txt"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate QR codes' },
      { status: 500 }
    );
  }
}
