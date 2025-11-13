import { NextRequest, NextResponse } from 'next/server';
import { getQRCode, getAuthStatus } from '@/lib/whatsapp-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';

    if (action === 'qr') {
      // Get QR code
      const qrData = await getQRCode();
      return NextResponse.json({
        success: true,
        data: qrData,
      });
    } else {
      // Get auth status
      const status = await getAuthStatus();
      return NextResponse.json({
        success: true,
        data: status,
      });
    }
  } catch (error: any) {
    console.error('WhatsApp auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get authentication status',
      },
      { status: 500 }
    );
  }
}


