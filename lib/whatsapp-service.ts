/**
 * WhatsApp Service Client
 * Communicates with the separate WhatsApp server
 */

// Get environment variables - prefer server-side vars in API routes
function getServiceUrl(): string {
  let url = '';
  
  // In API routes, use server-side env var
  if (typeof window === 'undefined') {
    url = process.env.WHATSAPP_SERVICE_URL || process.env.NEXT_PUBLIC_WHATSAPP_SERVICE_URL || '';
  } else {
    // In client-side, use public env var
    url = process.env.NEXT_PUBLIC_WHATSAPP_SERVICE_URL || '';
  }
  
  // If URL is localhost, ensure it uses http:// not https://
  if (url && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    // Remove any existing protocol
    url = url.replace(/^https?:\/\//, '');
    // Always use http:// for localhost
    url = `http://${url}`;
  } else if (url && !url.match(/^https?:\/\//)) {
    // If no protocol specified and not localhost, default to https://
    url = `https://${url}`;
  }
  
  return url;
}

function getApiKey(): string {
  // API key should only be available server-side
  if (typeof window === 'undefined') {
    return process.env.WHATSAPP_API_KEY || '';
  }
  return '';
}

export interface QRCodeResponse {
  qr: string | null;
  authenticated: boolean;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  ready: boolean;
}

export interface SendBatchRequest {
  contacts: Array<{ phone: string; name: string | null }>;
  messageTemplate: string;
  batchSizeMin?: number;
  batchSizeMax?: number;
  delayBetweenMessagesMin?: number;
  delayBetweenMessagesMax?: number;
  delayBetweenBatchesMin?: number;
  delayBetweenBatchesMax?: number;
}

export interface SendBatchResponse {
  success: boolean;
  jobId: string;
  message?: string;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'error';
  progress: {
    totalContacts: number;
    contactsProcessed: number;
    messagesSent: number;
    messagesFailed: number;
    batchesCompleted: number;
    currentBatch: number;
  };
  errors: string[];
  startedAt?: string;
  completedAt?: string;
}

/**
 * Get authentication QR code
 */
export async function getQRCode(): Promise<QRCodeResponse> {
  try {
    const serviceUrl = getServiceUrl();
    if (!serviceUrl) {
      throw new Error('WHATSAPP_SERVICE_URL is not configured. Please set WHATSAPP_SERVICE_URL in .env.local');
    }
    
    const fullUrl = `${serviceUrl}/auth/qr`;
    console.log('🔗 Getting QR code from:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get QR code: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error getting QR code:', error);
    throw new Error(`Failed to get QR code: ${error.message}`);
  }
}

/**
 * Check authentication status
 */
export async function getAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const serviceUrl = getServiceUrl();
    if (!serviceUrl) {
      throw new Error('WHATSAPP_SERVICE_URL is not configured. Please set WHATSAPP_SERVICE_URL in .env.local');
    }
    
    const fullUrl = `${serviceUrl}/auth/status`;
    console.log('🔗 Getting auth status from:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get auth status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error getting auth status:', error);
    throw new Error(`Failed to get auth status: ${error.message}`);
  }
}

/**
 * Send messages in batches
 */
export async function sendBatch(request: SendBatchRequest): Promise<SendBatchResponse> {
  try {
    const serviceUrl = getServiceUrl();
    if (!serviceUrl) {
      throw new Error('WHATSAPP_SERVICE_URL is not configured');
    }
    
    // Debug: Verify messageTemplate has newlines before sending
    const newlineCount = (request.messageTemplate.match(/\n/g) || []).length;
    console.log('📤 whatsapp-service - messageTemplate length:', request.messageTemplate.length);
    console.log('📤 Contains newlines:', request.messageTemplate.includes('\n'));
    console.log('📤 Newline count:', newlineCount);
    
    // Ensure newlines are preserved - JSON.stringify should handle this, but verify
    const messageTemplateWithNewlines = request.messageTemplate;
    
    const requestBody = {
      contacts: request.contacts,
      messageTemplate: messageTemplateWithNewlines, // JSON.stringify will preserve \n as-is
      batchSizeMin: request.batchSizeMin || 30,
      batchSizeMax: request.batchSizeMax || 50,
      delayBetweenMessagesMin: request.delayBetweenMessagesMin || 1000, // 1 second
      delayBetweenMessagesMax: request.delayBetweenMessagesMax || 3000, // 3 seconds
      delayBetweenBatchesMin: request.delayBetweenBatchesMin || 120000, // 2 minutes
      delayBetweenBatchesMax: request.delayBetweenBatchesMax || 300000, // 5 minutes
    };
    
    // Verify JSON stringify preserves newlines
    const jsonString = JSON.stringify(requestBody);
    const newlinesInJson = (jsonString.match(/\\n/g) || []).length;
    console.log('📤 JSON stringified - newlines in JSON string:', newlinesInJson);
    
    const response = await fetch(`${serviceUrl}/send/batch`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: jsonString, // JSON.stringify preserves \n as \n in the string
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to send batch: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error sending batch:', error);
    throw new Error(`Failed to send batch: ${error.message}`);
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  try {
    const serviceUrl = getServiceUrl();
    if (!serviceUrl) {
      throw new Error('WHATSAPP_SERVICE_URL is not configured');
    }
    
    const response = await fetch(`${serviceUrl}/send/status/${jobId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error getting job status:', error);
    throw new Error(`Failed to get job status: ${error.message}`);
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const serviceUrl = getServiceUrl();
    if (!serviceUrl) {
      throw new Error('WHATSAPP_SERVICE_URL is not configured');
    }
    
    const response = await fetch(`${serviceUrl}/send/cancel/${jobId}`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel job: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error cancelling job:', error);
    throw new Error(`Failed to cancel job: ${error.message}`);
  }
}

/**
 * Get request headers with authentication
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const apiKey = getApiKey();
  
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  
  return headers;
}

/**
 * Check if service is available
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    const serviceUrl = getServiceUrl();
    if (!serviceUrl) {
      return false;
    }
    
    const response = await fetch(`${serviceUrl}/health`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}


