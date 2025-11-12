# WhatsApp Bulk Messaging Service

This is a separate Node.js service that handles WhatsApp Web automation using `whatsapp-web.js`. It should be deployed to a service like Railway, Render, or Fly.io.

## Features

- WhatsApp Web authentication with QR code
- Batch message sending (30-50 messages per batch)
- Random delays between messages and batches
- Job tracking and status updates
- Cancellation support

## Deployment

### Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Set the root directory to `whatsapp-server`
4. Add environment variables:
   - `PORT` (optional, defaults to 3000)
   - `API_KEY` (recommended for security)
5. Deploy

### Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `whatsapp-server`
4. Add environment variables:
   - `PORT` (optional)
   - `API_KEY` (recommended)
5. Deploy

### Fly.io

1. Install Fly CLI: `flyctl install`
2. Create `fly.toml` in `whatsapp-server` directory
3. Run: `flyctl launch`
4. Set secrets:
   - `flyctl secrets set API_KEY=your-key`
5. Deploy: `flyctl deploy`

## Environment Variables

- `PORT`: Server port (default: 3000)
- `API_KEY`: API key for authentication (optional but recommended)

## API Endpoints

- `GET /health` - Health check
- `GET /auth/qr` - Get QR code for authentication
- `GET /auth/status` - Check authentication status
- `POST /send/batch` - Send messages in batches
- `GET /send/status/:jobId` - Get job status
- `POST /send/cancel/:jobId` - Cancel a job

## First-Time Setup

1. Deploy the service
2. Get the service URL
3. Add `WHATSAPP_SERVICE_URL` to your Vercel environment variables
4. Add `WHATSAPP_API_KEY` if you set an API_KEY
5. Visit the WhatsApp Bulk page in staff portal
6. Scan the QR code with your phone
7. Once authenticated, you can start sending messages

## Notes

- The service stores WhatsApp session in `.wwebjs_auth` directory
- Session persists across restarts
- If session expires, you'll need to scan QR code again
- WhatsApp may rate limit or ban accounts for bulk messaging (use at your own risk)

