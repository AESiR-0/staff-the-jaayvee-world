# Supabase Realtime Setup for Notifications

This document explains how to enable Supabase Realtime for the notifications system.

## Prerequisites

1. **Supabase Project**: Your database must be hosted on Supabase (not a standalone PostgreSQL instance)
2. **Environment Variables**: Ensure the following are set in your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

## Enabling Realtime on the Notifications Table

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Database** → **Replication**
4. Find the `notifications` table in the list
5. Toggle the switch to enable Realtime for the `notifications` table
6. Save the changes

### Option 2: Via SQL

Run the following SQL in the Supabase SQL Editor:

```sql
-- Enable Realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Option 3: Via Supabase CLI

If you're using Supabase CLI:

```bash
supabase db enable-realtime notifications
```

## Verifying Realtime is Enabled

1. Go to Supabase Dashboard → **Database** → **Replication**
2. Check that `notifications` appears in the list with Realtime enabled
3. The table should show a green indicator or checkmark

## How It Works

Once Realtime is enabled:

1. The `NotificationManager` component subscribes to changes on the `notifications` table
2. When a new notification is inserted for a user, it's immediately pushed to the client via WebSocket
3. No polling is required - notifications appear instantly
4. The system automatically falls back to polling if Realtime is not available

## Troubleshooting

### Realtime Not Working

1. **Check Environment Variables**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Check Browser Console**: Look for Realtime subscription status messages
   - `✅ Successfully subscribed to notifications` - Working correctly
   - `❌ Realtime channel error` - Check Supabase configuration

3. **Verify Table Name**: Ensure the table is named exactly `notifications` (lowercase)

4. **Check Row Level Security (RLS)**: If RLS is enabled, ensure the anon key has read access to the notifications table

### Fallback to Polling

If Realtime is not configured or fails, the system automatically falls back to polling every 30 seconds. You'll see a warning in the console:
```
⚠️ Supabase not configured, falling back to polling
```

## Security Considerations

- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose in client-side code
- Realtime subscriptions are filtered by `user_id` to ensure users only receive their own notifications
- Row Level Security (RLS) policies should be configured to restrict access appropriately

## Testing

1. Create a test notification in the database
2. Check the browser console for Realtime messages
3. The notification should appear immediately without page refresh

