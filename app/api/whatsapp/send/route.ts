import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-parser';
import { sendBatch } from '@/lib/whatsapp-service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONTACTS = 10000;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get('csv') as File;
    let messageTemplate = formData.get('message') as string;
    
    // CRITICAL: FormData.get() for text fields should preserve newlines
    // But let's verify by checking the raw value
    console.log('🔍 DEBUG FormData.get("message"):');
    console.log('🔍 Type:', typeof messageTemplate);
    console.log('🔍 Value (first 200 chars):', messageTemplate?.substring(0, 200));
    console.log('🔍 Has \\n:', messageTemplate?.includes('\n') || false);
    console.log('🔍 Has \\r\\n:', messageTemplate?.includes('\r\n') || false);
    console.log('🔍 Has \\r:', messageTemplate?.includes('\r') || false);
    console.log('🔍 Char codes (first 50):', messageTemplate?.substring(0, 50).split('').map(c => c.charCodeAt(0)).join(','));

    if (!csvFile) {
      return NextResponse.json(
        { success: false, error: 'CSV file is required' },
        { status: 400 }
      );
    }

    if (!messageTemplate || !messageTemplate.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message template is required' },
        { status: 400 }
      );
    }

    // CRITICAL: FormData.get() returns the raw string value
    // Newlines should be preserved, but let's verify and normalize
    console.log('📥 Raw FormData message type:', typeof messageTemplate);
    console.log('📥 Raw FormData message length:', messageTemplate?.length || 0);
    
    // Check for different newline formats
    const hasCRLF = messageTemplate.includes('\r\n');
    const hasLF = messageTemplate.includes('\n');
    const hasCR = messageTemplate.includes('\r');
    console.log('📥 Has \\r\\n:', hasCRLF, '| Has \\n:', hasLF, '| Has \\r:', hasCR);
    
    // Normalize all newline formats to \n
    if (hasCRLF || hasCR) {
      messageTemplate = messageTemplate.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      console.log('📥 Normalized newlines to \\n');
    }
    
    // Final verification
    const newlineCount = (messageTemplate.match(/\n/g) || []).length;
    console.log('📝 API Route - Final message length:', messageTemplate.length, '| Newlines:', newlineCount);
    if (newlineCount > 0) {
      const firstNewlineIndex = messageTemplate.indexOf('\n');
      console.log('📝 First newline at position:', firstNewlineIndex);
      const preview = messageTemplate.substring(0, Math.min(300, messageTemplate.length)).replace(/\n/g, '\\n');
      console.log('📝 Preview with \\n visible:', preview);
    } else {
      console.error('❌ WARNING: No newlines found in messageTemplate after normalization!');
      console.error('❌ Raw message (first 200 chars):', messageTemplate.substring(0, 200));
    }

    // Validate file size
    if (csvFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const csvText = await csvFile.text();
    const parseResult = parseCSV(csvText);

    if (parseResult.contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid contacts found in CSV file' },
        { status: 400 }
      );
    }

    if (parseResult.contacts.length > MAX_CONTACTS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_CONTACTS} contacts allowed` },
        { status: 400 }
      );
    }

    // Send batch request to WhatsApp service
    // DO NOT TRIM - preserve all newlines including at start/end
    // WhatsApp needs the exact message with all newlines intact
    console.log('📤 Sending to WhatsApp service:');
    console.log('📤 Message length:', messageTemplate.length);
    console.log('📤 Newline count:', newlineCount);
    console.log('📤 Preview (first 300 with \\n):', messageTemplate.substring(0, 300).replace(/\n/g, '\\n'));
    
    const batchResponse = await sendBatch({
      contacts: parseResult.contacts,
      messageTemplate: messageTemplate, // Send exactly as received, no trimming
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: batchResponse.jobId,
        totalContacts: parseResult.contacts.length,
        validContacts: parseResult.validRows,
        errors: parseResult.errors,
      },
    });
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send messages',
      },
      { status: 500 }
    );
  }
}


