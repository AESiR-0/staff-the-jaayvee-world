# WhatsApp Bulk Messaging - Complete Setup Guide

This guide will walk you through setting up the WhatsApp bulk messaging feature step by step.

## ⚠️ Quick Start

If you see the error: **"Please set WHATSAPP_SERVICE_URL in your Vercel environment variables"**

1. **First**: Deploy the WhatsApp server (Step 1 below)
2. **Then**: Configure Vercel environment variables (Step 2 below)
3. **Finally**: Redeploy your Vercel project

## Prerequisites

- A Railway, Render, or Fly.io account (free tier works)
- Access to your Vercel project settings
- A WhatsApp account (the one you'll use for sending messages)

## Step 1: Deploy the WhatsApp Server

### Option A: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `staff-the-jaayvee-world` repository
   - Set **Root Directory** to: `whatsapp-server`

3. **Configure Environment Variables**
   - Go to your project → Variables tab
   - Add these variables:
     ```
     PORT=3000
     API_KEY=your-secret-key-here (generate a random string)
     ```
   - Save the variables

4. **Deploy**
   - Railway will automatically detect the `package.json` and deploy
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://your-project.up.railway.app`)

### Option B: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `whatsapp-bulk-service`
     - **Root Directory**: `whatsapp-server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node

3. **Add Environment Variables**
   - Scroll to "Environment Variables"
   - Add:
     ```
     PORT=3000
     API_KEY=your-secret-key-here
     ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Note the service URL

### Option C: Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly**
   ```bash
   flyctl auth login
   ```

3. **Navigate to WhatsApp Server Directory**
   ```bash
   cd whatsapp-server
   ```

4. **Launch App**
   ```bash
   flyctl launch
   ```
   - Follow prompts to create app
   - Don't deploy yet

5. **Set Secrets**
   ```bash
   flyctl secrets set API_KEY=your-secret-key-here
   ```

6. **Deploy**
   ```bash
   flyctl deploy
   ```

## Step 2: Configure Vercel Environment Variables

**⚠️ IMPORTANT**: You must complete Step 1 (deploy WhatsApp server) before this step, as you need the service URL.

1. **Go to Vercel Dashboard**
   - Navigate to [vercel.com](https://vercel.com)
   - Sign in and go to your `staff-the-jaayvee-world` project
   - Click on **Settings** → **Environment Variables**

2. **Add Environment Variables**
   - Click **Add New** button
   - Add the following variables for **Production**, **Preview**, and **Development**:
   
   **Variable 1:**
   - **Key**: `WHATSAPP_SERVICE_URL`
   - **Value**: `https://your-service-url.railway.app` (replace with your actual URL from Step 1)
   - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**
   
   **Variable 2:**
   - **Key**: `WHATSAPP_API_KEY`
   - **Value**: `your-secret-key-here` (same value you used in Step 1)
   - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**

   **Important Notes:**
   - Replace `https://your-service-url.railway.app` with your **actual service URL** from Step 1
   - The `WHATSAPP_API_KEY` must match exactly what you set in the WhatsApp server
   - Make sure to select all environments (Production, Preview, Development)

3. **Redeploy Vercel**
   - After adding variables, go to **Deployments** tab
   - Find your latest deployment
   - Click the **⋯** (three dots) menu → **Redeploy**
   - Or simply push a new commit to trigger automatic redeploy
   - Wait for deployment to complete

4. **Verify Configuration**
   - After redeploy, go to your staff portal
   - Navigate to the WhatsApp Bulk page
   - The warning message should disappear if configured correctly

## Step 3: First-Time Authentication

1. **Access WhatsApp Bulk Page**
   - Go to your staff portal: `https://staff.thejaayveeworld.com`
   - Navigate to "WhatsApp Bulk" in the sidebar
   - Or go directly to: `https://staff.thejaayveeworld.com/whatsapp-bulk`

2. **Scan QR Code**
   - You'll see a QR code on the page
   - Open WhatsApp on your phone
   - Go to: **Settings → Linked Devices → Link a Device**
   - Scan the QR code displayed on the page
   - Wait for "WhatsApp is authenticated and ready" message

3. **Verify Connection**
   - The page should automatically update when authenticated
   - You should see a green checkmark

## Step 4: Prepare Your CSV File

1. **Create CSV File**
   - Open Excel, Google Sheets, or any text editor
   - Create a file with two columns:
     ```
     phone,name
     9876543210,John Doe
     9876543211,Jane Smith
     9876543212,
     ```
   - **Phone format**: Indian numbers (10 digits), with or without +91
   - **Name**: Optional (90% should have names)
   - Save as `contacts.csv`

2. **CSV Format Examples**
   ```
   phone,name
   9876543210,John Doe
   9876543211,Jane Smith
   +91 98765 43212,Mary Johnson
   9876543213,
   ```

## Step 5: Send Messages

1. **Enter Message Template**
   - In the WhatsApp Bulk page, enter your message
   - Use `{name}` as a placeholder for contact names
   - Example: `Hi {name}, welcome to our service!`

2. **Upload CSV**
   - Click "Click to upload CSV"
   - Select your `contacts.csv` file
   - Preview will show parsed contacts

3. **Start Sending**
   - Click "Start Sending" button
   - Monitor progress in real-time
   - Messages will be sent in batches of 30-50
   - Random delays between batches (2-5 minutes)

4. **Monitor Progress**
   - Watch the progress bar
   - See batches completed, messages sent, failures
   - You can cancel if needed

## Troubleshooting

### QR Code Not Appearing
- Check that the WhatsApp server is running
- Verify `WHATSAPP_SERVICE_URL` is correct in Vercel
- Check server logs in Railway/Render dashboard

### Authentication Fails
- Make sure you scanned the QR code correctly
- Try refreshing the page
- Check server logs for errors
- The session persists, so you only need to scan once

### Messages Not Sending
- Verify WhatsApp is authenticated (green checkmark)
- Check server logs for errors
- Ensure phone numbers are in correct format
- WhatsApp may rate limit - wait and try again

### Service Not Responding
- Check Railway/Render dashboard for service status
- Verify the service URL is correct
- Check environment variables are set
- Restart the service if needed

## Important Notes

⚠️ **Account Ban Risk**: Using automation violates WhatsApp's Terms of Service. Your account may be banned. Use at your own risk.

- Start with small batches (10-20 messages) to test
- Don't send too frequently
- Use random delays (already implemented)
- Monitor for any warnings from WhatsApp

## Support

If you encounter issues:
1. Check server logs in Railway/Render dashboard
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure WhatsApp service is running and accessible

## Security

- Keep your `API_KEY` secret
- Don't commit `.env` files
- Use HTTPS for all services
- Restrict access to authorized staff only

