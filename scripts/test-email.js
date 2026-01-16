/**
 * Test Email Configuration
 * 
 * This script tests if your email service is properly configured.
 * Run with: node scripts/test-email.js
 */

require('dotenv').config({ path: '.env' })

async function testEmail() {
  console.log('\n📧 Testing Email Configuration...\n')
  
  // Check which provider is configured
  const hasResend = !!process.env.RESEND_API_KEY
  const hasSendGrid = !!process.env.SENDGRID_API_KEY
  const hasAWS = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  
  console.log('Configuration Status:')
  console.log('  Resend:', hasResend ? '✅ Configured' : '❌ Not configured')
  console.log('  SendGrid:', hasSendGrid ? '✅ Configured' : '❌ Not configured')
  console.log('  AWS SES:', hasAWS ? '✅ Configured' : '❌ Not configured')
  console.log('')
  
  if (!hasResend && !hasSendGrid && !hasAWS) {
    console.log('❌ No email provider configured!\n')
    console.log('To set up email:')
    console.log('1. Sign up at https://resend.com (free)')
    console.log('2. Get your API key from the dashboard')
    console.log('3. Add to .env file:')
    console.log('   RESEND_API_KEY=re_your_api_key_here')
    console.log('4. Restart your server\n')
    return
  }
  
  // Test the email service
  try {
    const { emailService } = await import('../lib/email.ts')
    
    console.log('Sending test email...')
    const testEmail = process.env.TEST_EMAIL || 'test@example.com'
    
    const result = await emailService.sendPasswordResetEmail(
      testEmail,
      'test-token-12345'
    )
    
    if (result) {
      console.log('✅ Email service is working!')
      console.log(`   Test email would be sent to: ${testEmail}`)
      console.log('   (In production, this would send a real email)')
    } else {
      console.log('❌ Email service failed to send')
      console.log('   Check your API key and server logs for details')
    }
  } catch (error) {
    console.error('❌ Error testing email:', error.message)
    console.error('   Make sure all dependencies are installed: npm install')
  }
  
  console.log('')
}

testEmail().catch(console.error)
