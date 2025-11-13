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

// Initialize WhatsApp client with retry logic
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;
let isInitializing = false;

function initializeClient() {
  // Prevent concurrent initialization attempts
  if (isInitializing) {
    console.log('Initialization already in progress, skipping...');
    return;
  }

  if (client && isReady) {
    console.log('Client already initialized and ready');
    return;
  }

  if (client && !isReady && initializationAttempts >= MAX_INIT_ATTEMPTS) {
    console.error('Max initialization attempts reached. Please restart the server.');
    return;
  }

  // Clean up existing client if needed
  if (client && !isReady) {
    console.log('Cleaning up existing client before retry...');
    cleanupClient();
    // Wait a bit longer before retrying
    setTimeout(() => {
      isInitializing = false;
      initializeClient();
    }, 5000);
    return;
  }

  initializationAttempts++;
  isInitializing = true;
  console.log(`Initializing WhatsApp client (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`);

  try {
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
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
        ],
        timeout: 120000, // 120 second timeout for slower connections
        ignoreHTTPSErrors: true,
      },
      // Remove webVersionCache - let it use default behavior
      // This often causes navigation issues
    });

    // Set up event handlers BEFORE initialization
    client.on('qr', async (qr) => {
      console.log('QR Code received');
      try {
        qrCodeData = await qrcode.toDataURL(qr);
        isAuthenticated = false;
        isReady = false;
        isInitializing = false;
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    });

    client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      isAuthenticated = true;
      isReady = true;
      qrCodeData = null;
      initializationAttempts = 0; // Reset on success
      isInitializing = false;
    });

    client.on('authenticated', () => {
      console.log('WhatsApp client authenticated');
      isAuthenticated = true;
      isInitializing = false;
    });

    client.on('auth_failure', (msg) => {
      console.error('Authentication failure:', msg);
      isAuthenticated = false;
      isReady = false;
      isInitializing = false;
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      isAuthenticated = false;
      isReady = false;
      qrCodeData = null;
      isInitializing = false;
      cleanupClient();
      // Reinitialize after disconnect with delay
      setTimeout(() => {
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
          initializationAttempts = 0; // Reset attempts on disconnect
          initializeClient();
        } else {
          console.error('Max initialization attempts reached. Please restart the server.');
        }
      }, 10000); // Longer delay after disconnect
    });

    // Handle loading screen
    client.on('loading_screen', (percent, message) => {
      console.log(`Loading: ${percent}% - ${message}`);
    });

    // Initialize with better error handling
    // Use a longer delay to ensure client is fully set up
    setTimeout(async () => {
      try {
        console.log('Calling client.initialize()...');
        await client.initialize();
        console.log('client.initialize() called successfully');
      } catch (err) {
        const errorMsg = err.message || err.toString() || 'Unknown error';
        console.error('Error during client.initialize():', errorMsg);
        
        // Check if it's a navigation/execution context error
        if (errorMsg.includes('Execution context was destroyed') || 
            errorMsg.includes('navigation') ||
            errorMsg.includes('Target closed') ||
            errorMsg.includes('Session closed')) {
          console.log('Navigation/context error detected, will retry...');
          isInitializing = false;
          
          if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            cleanupClient();
            // Wait longer before retrying navigation errors
            setTimeout(() => {
              initializeClient();
            }, 8000);
          } else {
            console.error('Max retry attempts reached for initialization.');
            isInitializing = false;
          }
        } else {
          // Other errors - still retry but with shorter delay
          isInitializing = false;
          if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            cleanupClient();
            setTimeout(() => {
              initializeClient();
            }, 5000);
          } else {
            console.error('Max initialization attempts reached.');
            isInitializing = false;
          }
        }
      }
    }, 2000); // Longer initial delay to ensure everything is ready
  } catch (err) {
    const errorMsg = err.message || err.toString() || 'Unknown error';
    console.error('Error creating WhatsApp client:', errorMsg);
    isInitializing = false;
    
    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
      cleanupClient();
      setTimeout(() => {
        initializeClient();
      }, 5000);
    } else {
      console.error('Max initialization attempts reached. Please restart the server.');
      isInitializing = false;
    }
  }
}

// Cleanup client properly
function cleanupClient() {
  if (client) {
    try {
      // Remove all event listeners first
      client.removeAllListeners();
      // Then destroy
      client.destroy().catch(() => {
        // Ignore errors during cleanup
      });
    } catch (err) {
      // Ignore errors during cleanup
      console.log('Error during cleanup (ignored):', err.message);
    }
    client = null;
  }
  isAuthenticated = false;
  isReady = false;
  qrCodeData = null;
  isInitializing = false;
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

  // CRITICAL: Verify messageTemplate received with newlines
  // Express.json() should preserve \n characters from JSON
  const receivedNewlineCount = (messageTemplate?.match(/\n/g) || []).length || 0;
  console.log('═══════════════════════════════════════════════════════');
  console.log('📥 Server - Received messageTemplate from API');
  console.log('📥 Type:', typeof messageTemplate);
  console.log('📥 Length:', messageTemplate?.length || 0);
  console.log('📥 Contains \\n:', messageTemplate?.includes('\n') || false);
  console.log('📥 Newline count:', receivedNewlineCount);
  
  if (receivedNewlineCount > 0) {
    const firstNewlineIndex = messageTemplate?.indexOf('\n') || -1;
    console.log('✅ NEWLINES RECEIVED!');
    console.log('📥 First newline at position:', firstNewlineIndex);
    console.log('📥 Full message with \\n shown:');
    console.log(messageTemplate?.replace(/\n/g, '\\n').replace(/\r/g, '\\r') || '');
  } else {
    console.error('❌ NO NEWLINES RECEIVED!');
    console.error('❌ Raw messageTemplate (first 200 chars):', messageTemplate?.substring(0, 200) || '');
    console.error('❌ This means newlines were lost before reaching the server!');
  }
  console.log('═══════════════════════════════════════════════════════');

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
        // Format message with name placeholder - preserve original formatting including newlines
        // The messageTemplate already contains WhatsApp markdown formatting (*bold*, _italic_, etc.)
        let message = String(messageTemplate); // Ensure it's a string
        
        // Replace {name} placeholder
        if (contact.name) {
          message = message.replace(/{name}/g, contact.name);
        } else {
          message = message.replace(/{name}/g, '');
        }
        
        // DO NOT TRIM OR MODIFY - send exactly as is to preserve all newlines
        // WhatsApp Web.js will handle \n characters as line breaks automatically
        
        // Debug for ALL contacts to see what's happening
        const newlineCount = (message.match(/\n/g) || []).length;
        const templateNewlineCount = (messageTemplate.match(/\n/g) || []).length;
        
        console.log(`📝 Contact: ${contact.name || contact.phone}`);
        console.log(`📝 Template newlines: ${templateNewlineCount} | Message newlines: ${newlineCount}`);
        
        if (newlineCount === 0 && templateNewlineCount > 0) {
          console.error(`❌ ERROR: Newlines lost during {name} replacement!`);
          console.error(`❌ Template (first 200):`, messageTemplate.substring(0, 200).replace(/\n/g, '\\n'));
          console.error(`❌ Message (first 200):`, message.substring(0, 200));
        }
        
        if (newlineCount > 0) {
          console.log(`✅ Message has ${newlineCount} newlines`);
          console.log(`📝 Preview (first 200 with \\n):`, message.substring(0, 200).replace(/\n/g, '\\n'));
        }

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
        // Show message preview with newlines visible
        const newlineCountInMessage = (message.match(/\n/g) || []).length;
        const preview = message.substring(0, 200).replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        console.log(`📝 Message preview (first 200 chars, \\n shown): ${preview}`);
        console.log(`📝 Actual newline count in message: ${newlineCountInMessage}`);
        
        // If no newlines found, this is a problem!
        if (newlineCountInMessage === 0) {
          console.error(`❌ ERROR: Message has NO newlines! Expected them from template.`);
          console.error(`❌ Template had: ${(messageTemplate.match(/\n/g) || []).length} newlines`);
          console.error(`❌ Message content: "${message.substring(0, 100)}"`);
        }

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
            // WhatsApp Web.js preserves newlines (\n) automatically in text messages
            // CRITICAL: Ensure message is sent exactly as-is with all newlines preserved
            const hasNewlines = message.includes('\n');
            const newlineCount = (message.match(/\n/g) || []).length;
            
            if (contact.phone === contacts[0]?.phone && attempt === 1) {
              console.log(`📤 About to send to WhatsApp - message length: ${message.length}`);
              console.log(`📤 Has newlines: ${hasNewlines}, count: ${newlineCount}`);
              if (hasNewlines) {
                const firstNewlineIndex = message.indexOf('\n');
                console.log(`📤 First newline at position: ${firstNewlineIndex}`);
                // Show message with newlines visible as \n
                console.log(`📤 Message preview (first 400 chars with \\n):`, 
                  message.substring(0, 400).replace(/\n/g, '\\n'));
              }
            }
            
            // Send message - WhatsApp Web.js should preserve \n characters
            // The message string contains actual \n characters which WhatsApp will render as line breaks
            // Ensure message is a string and newlines are actual \n characters (not escaped)
            if (typeof message !== 'string') {
              console.error('❌ Message is not a string! Converting...', typeof message);
              message = String(message);
            }
            
            // Verify newlines are actual newline characters (char code 10)
            const hasActualNewlines = message.includes('\n') || message.includes(String.fromCharCode(10));
            if (!hasActualNewlines && newlineCount > 0) {
              console.warn('⚠️ Warning: Expected newlines but none found in message string');
            }
            
            // Send the message - WhatsApp Web.js will handle \n as line breaks
            // Create a fresh string to ensure no hidden characters
            const cleanMessage = String(message);
            
            // Final verification before sending
            if (contact.phone === contacts[0]?.phone && attempt === 1) {
              console.log('🚀 FINAL CHECK before sendMessage:');
              console.log('🚀 Message type:', typeof cleanMessage);
              console.log('🚀 Message length:', cleanMessage.length);
              console.log('🚀 Has \\n:', cleanMessage.includes('\n'));
              console.log('🚀 Has char code 10:', cleanMessage.includes(String.fromCharCode(10)));
              console.log('🚀 First 500 chars:', cleanMessage.substring(0, 500));
              // Show as hex to verify newline character
              const first500Hex = cleanMessage.substring(0, 500).split('').map(c => {
                if (c === '\n') return '\\n';
                if (c === '\r') return '\\r';
                return c;
              }).join('');
              console.log('🚀 First 500 with escaped newlines:', first500Hex);
            }
            
            // Ensure message has actual newline characters (char code 10)
            // WhatsApp Web.js should handle \n automatically
            let finalMessage = String(cleanMessage); // Ensure it's a string
            
            // Verify newlines are present
            const finalNewlineCount = (finalMessage.match(/\n/g) || []).length;
            
            // For first contact, log the exact message being sent
            if (contact.phone === contacts[0]?.phone && attempt === 1) {
              console.log('🚀 SENDING MESSAGE TO WHATSAPP:');
              console.log('🚀 Message length:', finalMessage.length);
              console.log('🚀 Newline count:', finalNewlineCount);
              console.log('🚀 Full message (with \\n visible):');
              console.log(finalMessage.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
              
              // Show character codes for first 100 chars to verify newlines
              const first100 = finalMessage.substring(0, 100);
              const charCodes = first100.split('').map((c, i) => {
                const code = c.charCodeAt(0);
                if (code === 10) return `${i}:\\n(10)`;
                if (code === 13) return `${i}:\\r(13)`;
                return null;
              }).filter(Boolean);
              if (charCodes.length > 0) {
                console.log('🚀 Newline positions (char codes):', charCodes.join(', '));
              }
            }
            
            // Send message - WhatsApp Web.js should preserve \n as line breaks
            // If newlines are in the string, they should render as line breaks in WhatsApp
            const sendPromise = client.sendMessage(chatId, finalMessage);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Message send timeout (30s)')), 30000)
            );
            
            await Promise.race([sendPromise, timeoutPromise]);
            
            // Log message preview for first contact to verify formatting
            if (contact.phone === contacts[0]?.phone && attempt === 1) {
              console.log(`✅ Message sent successfully to ${contact.phone}`);
              console.log(`📤 Message preview (showing newlines as \\n):`, 
                message.substring(0, 300).replace(/\n/g, '\\n'));
            } else {
              console.log(`✅ Message sent successfully to ${contact.phone}`);
            }
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

