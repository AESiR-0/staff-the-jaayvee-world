import { NextRequest, NextResponse } from 'next/server';
import { cancelJob } from '@/lib/whatsapp-service';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const result = await cancelJob(jobId);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    console.error('WhatsApp cancel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cancel job',
      },
      { status: 500 }
    );
  }
}


