import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/whatsapp-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const status = await getJobStatus(jobId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get job status',
      },
      { status: 500 }
    );
  }
}

