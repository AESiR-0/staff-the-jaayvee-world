import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv-parser';
import { sendBatch } from '@/lib/whatsapp-service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONTACTS = 10000;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get('csv') as File;
    const messageTemplate = formData.get('message') as string;

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
    const batchResponse = await sendBatch({
      contacts: parseResult.contacts,
      messageTemplate: messageTemplate.trim(),
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

