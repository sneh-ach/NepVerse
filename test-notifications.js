// Copy and paste this entire block into browser console

(async () => {
  console.log('🔔 Testing Notification Endpoints...\n');
  
  try {
    // 1. Check your notifications
    console.log('1️⃣ Checking notifications...');
    const notificationsRes = await fetch('/api/notifications', { credentials: 'include' });
    const notificationsData = await notificationsRes.json();
    console.log('📬 Notifications Response:', notificationsData);
    console.log('   Total:', notificationsData.total);
    console.log('   Unread:', notificationsData.unreadCount);
    console.log('   Notifications:', notificationsData.notifications);
    console.log('');
    
    // 2. Check your account status
    console.log('2️⃣ Checking account status...');
    const userStatusRes = await fetch('/api/debug/user-status', { credentials: 'include' });
    const userStatusData = await userStatusRes.json();
    console.log('👤 User Status:', userStatusData);
    console.log('   Email:', userStatusData.user?.email);
    console.log('   Email Verified:', userStatusData.user?.emailVerified);
    console.log('   Email Notifications:', userStatusData.user?.emailNotifications);
    console.log('   Can Receive Emails:', userStatusData.emailStatus?.canReceiveEmails);
    console.log('');
    
    // 3. Check all notification details
    console.log('3️⃣ Checking notification details...');
    const debugRes = await fetch('/api/debug/notifications', { credentials: 'include' });
    const debugData = await debugRes.json();
    console.log('🔍 Debug Info:', debugData);
    console.log('   Total Users:', debugData.system?.totalUsers);
    console.log('   Your Notifications:', debugData.notifications?.stats);
    console.log('   All Notifications:', debugData.notifications?.all);
    console.log('');
    
    // 4. Create a test notification
    console.log('4️⃣ Creating test notification...');
    const testRes = await fetch('/api/debug/create-test-notification', { 
      method: 'POST', 
      credentials: 'include' 
    });
    const testData = await testRes.json();
    console.log('✅ Test Notification Result:', testData);
    console.log('');
    
    console.log('✨ All tests complete! Check the results above.');
    console.log('💡 If test notification was created, refresh the page to see it in the bell icon.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
