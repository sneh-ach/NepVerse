# How to Test Notification Endpoints

## Quick Test in Browser Console

1. **Open your website** (https://nepverse.vercel.app)
2. **Log in** to your account
3. **Open Browser DevTools** (Press F12 or Right-click → Inspect)
4. **Go to Console tab**
5. **Copy and paste these commands:**

### Check Your Notifications
```javascript
fetch('/api/notifications', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    console.log('📬 Notifications:', data);
    console.log('Total:', data.total);
    console.log('Unread:', data.unreadCount);
    console.log('All notifications:', data.notifications);
  });
```

### Check Your Account Status
```javascript
fetch('/api/debug/user-status', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    console.log('👤 User Status:', data);
    console.log('Email Verified:', data.user?.emailVerified);
    console.log('Email Notifications:', data.user?.emailNotifications);
    console.log('Can Receive Emails:', data.emailStatus?.canReceiveEmails);
  });
```

### Check All Notification Details
```javascript
fetch('/api/debug/notifications', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    console.log('🔔 Notification Debug:', data);
    console.log('Total notifications:', data.notifications.stats.total);
    console.log('Unread:', data.notifications.stats.unread);
    console.log('All notifications:', data.notifications.all);
  });
```

### Create a Test Notification
```javascript
fetch('/api/debug/create-test-notification', { 
  method: 'POST', 
  credentials: 'include' 
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Test notification created:', data);
    // Refresh the page to see the notification
    setTimeout(() => window.location.reload(), 1000);
  });
```

### Mark All Notifications as Read
```javascript
fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ markAllAsRead: true })
})
  .then(r => r.json())
  .then(console.log);
```

## Direct URL Access

While logged in, you can visit these URLs directly:

- **Get Notifications**: `https://nepverse.vercel.app/api/notifications`
- **Debug Notifications**: `https://nepverse.vercel.app/api/debug/notifications`
- **User Status**: `https://nepverse.vercel.app/api/debug/user-status`

## What to Look For

### When checking `/api/notifications`:
- `notifications`: Array of your notifications
- `total`: Total number of notifications
- `unreadCount`: Number of unread notifications

### When checking `/api/debug/notifications`:
- `notifications.all`: All your notifications
- `notifications.stats`: Statistics (total, unread, by type)
- `user`: Your user account details
- `system.totalUsers`: Total users in database

### When checking `/api/debug/user-status`:
- `user.emailVerified`: Is your email verified?
- `user.emailNotifications`: Are email notifications enabled?
- `emailStatus.canReceiveEmails`: Can you receive emails?

## Testing the Full Flow

1. **Create a test notification**:
   ```javascript
   fetch('/api/debug/create-test-notification', { 
     method: 'POST', 
     credentials: 'include' 
   }).then(r => r.json()).then(console.log);
   ```

2. **Check if it appears**:
   - Look at the bell icon in the header
   - Should show a red badge with "1"
   - Click the bell to see the notification

3. **Check the API**:
   ```javascript
   fetch('/api/notifications', { credentials: 'include' })
     .then(r => r.json())
     .then(data => console.log('Found:', data.notifications.length, 'notifications'));
   ```

## Troubleshooting

### No notifications showing?
1. Check `/api/debug/notifications` - see if any exist in database
2. Check `/api/debug/user-status` - verify your user ID
3. Check browser console for errors
4. Check server logs (Vercel dashboard)

### Notifications exist but not showing in UI?
1. Check browser console for fetch errors
2. Verify you're logged in
3. Check if the Notifications component is loading
4. Try refreshing the page

### Want to test with a real movie?
1. Upload a new movie in admin panel
2. Set `isPublished: true`
3. Check `/api/debug/notifications` to see if notifications were created
4. Check the bell icon in header
