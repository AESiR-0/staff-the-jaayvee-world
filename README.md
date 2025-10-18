# Staff Portal - The Jaayvee World

A modern staff portal for The Jaayvee World with face authentication, QR code management, and event tracking.

## Features

- **Face Authentication**: Secure login with camera capture
- **Dashboard**: Overview of events, referrals, and QR tools
- **QR Management**: Generate and assign QR code batches
- **Referral System**: Track referral performance and analytics
- **Event Management**: View and manage Talaash events
- **Modern UI**: Clean design with custom theme

## Tech Stack

- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Lucide React Icons

## Theme

- **Background**: White (#FFFFFF)
- **Foreground**: Black (#0C0C0C)
- **Accent**: Blue (#00719C)
- **Border**: Light Gray (#E0E0E0)
- **Muted**: Gray (#777777)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

- `/login` - Face authentication login
- `/dashboard` - Main dashboard with overview
- `/qr` - QR code generation and management
- `/referrals` - Referral tracking and analytics
- `/events` - Event management and tracking

## Components

- `Sidebar` - Unified navigation sidebar
- `FaceLogin` - Camera-based authentication
- `ReferralCard` - Referral information display
- `QrTools` - QR code generation tools
- `EventTable` - Event listing and management

## API Endpoints (Mock)

- `POST /api/staff/auth/initiate` - Authentication initiation
- `GET /api/talaash/events` - Fetch events
- `GET /api/staff/affiliates/stats` - Referral statistics
- `POST /api/staff/qr/generate` - Generate QR codes
- `POST /api/staff/qr/assign-range` - Assign QR range

## Development

The project uses:
- TypeScript for type safety
- Tailwind CSS for styling
- Next.js App Router for routing
- Custom theme configuration
- Responsive design
- Modern UI components