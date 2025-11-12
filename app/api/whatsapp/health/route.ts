import { NextRequest, NextResponse } from 'next/server';
import { checkServiceHealth } from '@/lib/whatsapp-service';

export async function GET(request: NextRequest) {
  try {
    const isHealthy = await checkServiceHealth();
    
    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      serviceUrl: process.env.WHATSAPP_SERVICE_URL ? 'configured' : 'not configured',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: error.message || 'Health check failed',
      },
      { status: 500 }
    );
  }
}

