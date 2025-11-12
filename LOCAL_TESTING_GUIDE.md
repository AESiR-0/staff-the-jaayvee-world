# Local Testing Guide - WhatsApp Bulk Messaging

This guide will help you test the WhatsApp bulk messaging feature on your local machine before deploying.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A WhatsApp account (the one you'll use for sending)

## Step 1: Install Dependencies for WhatsApp Server

1. **Navigate to WhatsApp server directory:**
   ```bash
   cd whatsapp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - express
   - whatsapp-web.js
   - qrcode
   - cors
   - uuid

## Step 2: Create Environment File for WhatsApp Server

1. **Create `.env` file in `whatsapp-server` directory:**
   ```bash
   cd whatsapp-server
   touch .env
   ```

2. **Add environment variables to `.env`:**
   ```
   PORT=3001
   API_KEY=test-api-key-123
   ```

   **Note:** Use port 3001 to avoid conflict with Next.js (which uses 3000)

## Step 3: Start WhatsApp Server Locally

1. **Run the server:**
   ```bash
   npm start
   ```

   Or for development with auto-restart (if you have nodemon):
   ```bash
   npx nodemon server.js
   ```

2. **Verify server is running:**
   - You should see: `WhatsApp service running on port 3001`
   - Open browser and go to: `http://localhost:3001/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Keep this terminal open** - the server needs to keep running

## Step 4: Configure Staff Portal for Local Testing

1. **Navigate back to staff portal root:**
   ```bash
   cd ..
   ```

2. **Create `.env.local` file in staff portal root:**
   ```bash
   touch .env.local
   ```

3. **Add environment variables to `.env.local`:**
   ```
   WHATSAPP_SERVICE_URL=http://localhost:3001
   WHATSAPP_API_KEY=test-api-key-123
   ```
   
   **Important:** Use `http://` (not `https://`) for localhost URLs!

   **Important:** 
   - Use `http://localhost:3001` (not https)
   - Use the same `API_KEY` as in Step 2

## Step 5: Start Staff Portal Locally

1. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Verify it's running:**
   - Should start on: `http://localhost:3000`
   - Open browser and go to: `http://localhost:3000`

## Step 6: Test the Integration

1. **Open Staff Portal:**
   - Go to: `http://localhost:3000/whatsapp-bulk`
   - Or navigate via sidebar: "WhatsApp Bulk"

2. **Check Service Health:**
   - The page should show if the service is configured
   - If you see a warning, check that `.env.local` is set correctly

3. **Authenticate WhatsApp:**
   - You should see a QR code
   - Open WhatsApp on your phone
   - Go to: **Settings → Linked Devices → Link a Device**
   - Scan the QR code
   - Wait for "WhatsApp is authenticated and ready" message

4. **Test with a Small CSV:**
   - Create a test CSV file with 2-3 contacts:
     ```csv
     phone,name
     9876543210,Test User 1
     9876543211,Test User 2
     ```
   - Enter a test message: `Hi {name}, this is a test message!`
   - Upload the CSV
   - Click "Start Sending"
   - Monitor the progress

## Troubleshooting

### WhatsApp Server Won't Start

**Error: Port already in use**
- Change `PORT=3001` to another port (e.g., `3002`)
- Update `WHATSAPP_SERVICE_URL` in `.env.local` accordingly

**Error: Module not found**
- Make sure you ran `npm install` in `whatsapp-server` directory
- Check that all dependencies are installed

### Staff Portal Can't Connect to Server

**Error: Service not configured**
- Check `.env.local` file exists in staff portal root
- Verify `WHATSAPP_SERVICE_URL=http://localhost:3001` (or your port)
- Restart the Next.js dev server after changing `.env.local`

**Error: Connection refused**
- Make sure WhatsApp server is running
- Check the port matches in both `.env` files
- Try accessing `http://localhost:3001/health` directly in browser

### QR Code Not Appearing

- Check WhatsApp server logs for errors
- Verify server is running and accessible
- Check browser console for errors
- Try refreshing the page

### Messages Not Sending

- Verify WhatsApp is authenticated (green checkmark)
- Check server logs for errors
- Ensure phone numbers are in correct format (+91XXXXXXXXXX)
- Test with a single contact first

## Testing Checklist

- [ ] WhatsApp server starts without errors
- [ ] Server health check returns OK
- [ ] Staff portal shows service is configured
- [ ] QR code appears and can be scanned
- [ ] Authentication completes successfully
- [ ] CSV file uploads and parses correctly
- [ ] Test message sends to a test contact
- [ ] Progress tracking works
- [ ] Job cancellation works (if needed)

## Next Steps After Local Testing

Once local testing is successful:

1. **Deploy WhatsApp Server** to Railway/Render/Fly.io
2. **Update Vercel Environment Variables** with production server URL
3. **Deploy Staff Portal** to Vercel
4. **Re-authenticate** WhatsApp (scan QR code again on production)

## Important Notes

- **Session Persistence:** The WhatsApp session is saved in `whatsapp-server/.wwebjs_auth/`
- **Don't Commit:** Never commit `.env` or `.env.local` files
- **Test Carefully:** Start with 1-2 test contacts before sending to many
- **Account Risk:** Remember that bulk messaging violates WhatsApp ToS

## Quick Start Commands

```bash
# Terminal 1: Start WhatsApp Server
cd whatsapp-server
npm install
npm start

# Terminal 2: Start Staff Portal
cd ..
npm run dev
```

Then open: `http://localhost:3000/whatsapp-bulk`

