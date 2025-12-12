import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

// Helper to get auth token from request
function getAuthTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    const token = request.cookies.get('auth-token')?.value;
    return token || null;
}

// POST - Lock/unlock campaign or specific messages
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = getAuthTokenFromRequest(request);
        const body = await request.json();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }

        const response = await fetch(`${API_BASE_URL}/api/whatsapp/campaigns/${id}/lock`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            credentials: 'include',
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Campaign lock error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to lock/unlock campaign' },
            { status: 500 }
        );
    }
}
