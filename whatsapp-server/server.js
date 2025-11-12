/**
 * WhatsApp Bulk Messaging Server
 * Separate Node.js service for WhatsApp Web automation
 * Deploy to Railway/Render/Fly.io
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3003;
const API_KEY = process.env.API_KEY || '';

// Middleware
app.use(cors());
app.use(express.json());

// Verify API key middleware
const verifyApiKey = (req, res, next) => {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// WhatsApp client
let client = null;
let qrCodeData = null;
let isAuthenticated = false;
let isReady = false;

// Job storage (in-memory, use Redis for production)
const jobs = new Map();

// Initialize WhatsApp client
function initializeClient() {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qr) => {
    console.log('QR Code received');
    try {
      qrCodeData = await qrcode.toDataURL(qr);
      isAuthenticated = false;
      isReady = false;
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  });

  client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    isAuthenticated = true;
    isReady = true;
    qrCodeData = null;
  });

  client.on('authenticated', () => {
    console.log('WhatsApp client authenticated');
    isAuthenticated = true;
  });

  client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
    isAuthenticated = false;
    isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected:', reason);
    isAuthenticated = false;
    isReady = false;
    qrCodeData = null;
    // Reinitialize after disconnect
    setTimeout(() => {
      if (!client) {
        initializeClient();
        client.initialize();
      }
    }, 5000);
  });

  client.initialize();
}

// Initialize on startup
initializeClient();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get QR code
app.get('/auth/qr', verifyApiKey, (req, res) => {
  res.json({
    qr: qrCodeData,
    authenticated: isAuthenticated,
  });
});

// Get authentication status
app.get('/auth/status', verifyApiKey, (req, res) => {
  res.json({
    authenticated: isAuthenticated,
    ready: isReady,
  });
});

// Send messages in batches
app.post('/send/batch', verifyApiKey, async (req, res) => {
  if (!isReady) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp is not ready. Please authenticate first.',
    });
  }

  const {
    contacts,
    messageTemplate,
    batchSizeMin = 30,
    batchSizeMax = 50,
    delayBetweenMessagesMin = 1000,
    delayBetweenMessagesMax = 3000,
    delayBetweenBatchesMin = 120000, // 2 minutes
    delayBetweenBatchesMax = 300000, // 5 minutes
  } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Contacts array is required',
    });
  }

  if (!messageTemplate || !messageTemplate.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message template is required',
    });
  }

  const jobId = uuidv4();
  const job = {
    jobId,
    status: 'pending',
    progress: {
      totalContacts: contacts.length,
      contactsProcessed: 0,
      messagesSent: 0,
      messagesFailed: 0,
      batchesCompleted: 0,
      currentBatch: 0,
    },
    errors: [],
    startedAt: new Date().toISOString(),
    cancelled: false,
  };

  jobs.set(jobId, job);

  // Start sending in background
  sendBatchMessages(
    jobId,
    contacts,
    messageTemplate,
    {
      batchSizeMin,
      batchSizeMax,
      delayBetweenMessagesMin,
      delayBetweenMessagesMax,
      delayBetweenBatchesMin,
      delayBetweenBatchesMax,
    }
  ).catch((err) => {
    console.error('Error in batch sending:', err);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'error';
      job.errors.push(err.message);
    }
  });

  res.json({
    success: true,
    jobId,
  });
});

// Get job status
app.get('/send/status/:jobId', verifyApiKey, (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
    });
  }

  res.json(job);
});

// Cancel job
app.post('/send/cancel/:jobId', verifyApiKey, (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
    });
  }

  if (job.status === 'completed' || job.status === 'cancelled') {
    return res.json({
      success: false,
      message: 'Job is already completed or cancelled',
    });
  }

  job.cancelled = true;
  job.status = 'cancelled';
  job.completedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Job cancelled',
  });
});

// Send messages in batches
async function sendBatchMessages(
  jobId,
  contacts,
  messageTemplate,
  config
) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running';

  const batches = createBatches(contacts, config.batchSizeMin, config.batchSizeMax);
  let contactIndex = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    if (job.cancelled) {
      job.status = 'cancelled';
      job.completedAt = new Date().toISOString();
      return;
    }

    job.progress.currentBatch = batchIndex + 1;
    const batch = batches[batchIndex];

    // Send messages in current batch
    for (const contact of batch) {
      if (job.cancelled) {
        job.status = 'cancelled';
        job.completedAt = new Date().toISOString();
        return;
      }

      try {
        // Format message with name placeholder
        let message = messageTemplate;
        if (contact.name) {
          message = message.replace(/{name}/g, contact.name);
        } else {
          // Remove {name} placeholder if no name available
          message = message.replace(/{name}/g, '');
        }

        // Clean up message (remove extra whitespace)
        message = message.trim().replace(/\s+/g, ' ');

        // Validate phone number format
        const phoneNumber = contact.phone.replace(/[^0-9+]/g, ''); // Remove non-numeric except +
        if (!phoneNumber || phoneNumber.length < 10) {
          throw new Error(`Invalid phone number format: ${contact.phone}`);
        }

        // Format phone number for WhatsApp (remove + if present, ensure country code)
        let formattedPhone = phoneNumber;
        if (formattedPhone.startsWith('+')) {
          formattedPhone = formattedPhone.substring(1);
        }
        
        // Validate phone number length (should be 12 digits for +91XXXXXXXXXX)
        if (formattedPhone.length < 10 || formattedPhone.length > 15) {
          throw new Error(`Invalid phone number length: ${formattedPhone.length} digits`);
        }
        
        // Ensure it's in international format (should already be +91XXXXXXXXXX from CSV parser)
        const chatId = `${formattedPhone}@c.us`;
        
        console.log(`📤 Preparing to send to ${chatId} (${contact.name || 'No name'})`);
        console.log(`📝 Message preview: ${message.substring(0, 50)}...`);

        // Validate contact exists and is registered on WhatsApp
        let isValidContact = false;
        try {
          // Check if number is registered (this helps avoid "Evaluation failed" errors)
          const numberId = await client.getNumberId(formattedPhone);
          if (numberId) {
            isValidContact = true;
            console.log(`✅ Contact ${contact.phone} is registered on WhatsApp`);
          } else {
            throw new Error('Contact not found or not registered on WhatsApp');
          }
        } catch (validationError) {
          // If getNumberId fails, we'll still try to send (some contacts might work)
          console.warn(`⚠️ Could not validate contact ${contact.phone}:`, validationError.message);
          // Continue anyway - sometimes getNumberId fails but sendMessage works
        }

        // Try to send message with retry logic
        let lastError = null;
        const maxRetries = 2;
        let success = false;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 1) {
              console.log(`🔄 Retry attempt ${attempt} for ${contact.phone}`);
              await sleep(3000); // Wait 3 seconds before retry
            }
            
            // Small delay before sending to avoid rate limiting
            if (attempt === 1) {
              await sleep(500);
            }
            
            // Send message with timeout
            const sendPromise = client.sendMessage(chatId, message);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Message send timeout (30s)')), 30000)
            );
            
            await Promise.race([sendPromise, timeoutPromise]);
            
            console.log(`✅ Message sent successfully to ${contact.phone}`);
            success = true;
            break;
          } catch (retryError) {
            lastError = retryError;
            const errorMsg = retryError.message || retryError.toString() || 'Unknown error';
            console.warn(`⚠️ Attempt ${attempt} failed for ${contact.phone}:`, errorMsg);
            
            // Log full error for debugging
            if (errorMsg.includes('Evaluation failed')) {
              console.error(`❌ Full error details:`, {
                error: retryError,
                stack: retryError.stack,
                phone: contact.phone,
                chatId: chatId,
              });
            }
            
            // Don't retry for certain errors
            if (errorMsg.includes('not registered') || 
                errorMsg.includes('Invalid phone number') ||
                errorMsg.includes('not found')) {
              break;
            }
          }
        }
        
        if (success) {
          job.progress.messagesSent++;
        } else {
          throw lastError || new Error('Failed after retries');
        }
        
        job.progress.contactsProcessed++;
      } catch (error) {
        const errorMsg = error.message || error.toString() || 'Unknown error';
        console.error(`❌ Error sending to ${contact.phone}:`, errorMsg);
        console.error(`❌ Full error:`, error);
        
        // Provide more helpful error messages
        let userFriendlyError = errorMsg;
        if (errorMsg.includes('Evaluation failed')) {
          userFriendlyError = 'WhatsApp Web error - contact may not exist or number invalid';
        } else if (errorMsg.includes('timeout')) {
          userFriendlyError = 'Message send timeout - WhatsApp may be slow or contact unavailable';
        } else if (errorMsg.includes('not registered')) {
          userFriendlyError = 'Phone number not registered on WhatsApp';
        }
        
        job.progress.messagesFailed++;
        job.progress.contactsProcessed++;
        job.errors.push(`Failed to send to ${contact.phone}: ${userFriendlyError}`);
      }

      // Random delay between messages
      const delay = randomInt(
        config.delayBetweenMessagesMin,
        config.delayBetweenMessagesMax
      );
      await sleep(delay);
    }

    job.progress.batchesCompleted = batchIndex + 1;

    // Random delay between batches (except for last batch)
    if (batchIndex < batches.length - 1) {
      const batchDelay = randomInt(
        config.delayBetweenBatchesMin,
        config.delayBetweenBatchesMax
      );
      console.log(`Waiting ${batchDelay / 1000 / 60} minutes before next batch...`);
      await sleep(batchDelay);
    }
  }

  job.status = 'completed';
  job.completedAt = new Date().toISOString();
}

// Create batches with random sizes
function createBatches(contacts, minSize, maxSize) {
  const batches = [];
  let i = 0;

  while (i < contacts.length) {
    const batchSize = randomInt(minSize, maxSize);
    const batch = contacts.slice(i, i + batchSize);
    batches.push(batch);
    i += batchSize;
  }

  return batches;
}

// Utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp service running on port ${PORT}`);
});

