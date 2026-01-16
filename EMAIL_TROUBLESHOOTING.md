# Email Troubleshooting Guide

## Problem: Emails Show as "Sent" in Resend Dashboard But Not Received

If emails appear as "sent" in your Resend dashboard but you're not receiving them, here are the most common causes and solutions:

### 1. Check Spam/Junk Folder
- **Most common issue**: Emails from `onboarding@resend.dev` often go to spam
- Check your spam/junk folder
- Mark as "Not Spam" if found
- Add `onboarding@resend.dev` to your contacts/whitelist

### 2. Verify Sender Domain in Resend
- Go to https://resend.com/dashboard
- Navigate to **Domains** section
- The `resend.dev` domain should be automatically available
- If using a custom domain, make sure it's verified

### 3. Check Resend Dashboard for Delivery Status
- Go to Resend dashboard → **Emails** or **Logs**
- Click on the email that was sent
- Check the delivery status:
  - ✅ **Delivered**: Email was successfully delivered (check spam folder)
  - ⚠️ **Bounced**: Email address doesn't exist or is invalid
  - 🚫 **Blocked**: Recipient's email provider blocked the email
  - ⏳ **Pending**: Still being processed

### 4. Verify Email Address
- Make sure the email address you're sending to is correct
- Try sending to a different email address to test
- Check for typos in the email address

### 5. Check Resend Account Status
- Make sure your Resend account is verified
- Check if you've hit any rate limits (100 emails/day on free tier)
- Verify your API key is active

### 6. Test with a Different Email Provider
- Try sending to Gmail, Outlook, or another provider
- Some email providers are stricter than others

### 7. Verify Environment Variables
Check your `.env` file:
```bash
RESEND_API_KEY=re_GhUhpVCE_JZA6H7GPX4MNv6WdbC8y6rJ6
EMAIL_FROM="NepVerse <onboarding@resend.dev>"
```

Make sure:
- No quotes around the API key (unless needed)
- No extra spaces
- Restart server after changing `.env`

### 8. Check Server Logs
When you request a password reset, check your server console for:
```
[Email] ✅ Email sent successfully!
[Email]   Message ID: xxxxx
```

If you see errors, they will tell you what's wrong.

### 9. Production vs Development
- In development, emails from `onboarding@resend.dev` may go to spam
- For production, verify your own domain in Resend
- Update `EMAIL_FROM` to use your verified domain:
  ```
  EMAIL_FROM="NepVerse <noreply@yourdomain.com>"
  ```

### 10. Resend Test Mode
- Resend has a test mode that doesn't actually send emails
- Make sure you're not in test mode
- Check your Resend dashboard settings

## Quick Fixes

### Fix 1: Verify Domain (Recommended for Production)
1. Go to Resend dashboard → Domains
2. Add your domain (e.g., `nepverse.com`)
3. Add the DNS records Resend provides
4. Wait for verification (usually a few minutes)
5. Update `.env`:
   ```
   EMAIL_FROM="NepVerse <noreply@nepverse.com>"
   ```

### Fix 2: Check Email Address Format
Make sure the email address is valid:
- Correct format: `user@example.com`
- No spaces
- Valid domain

### Fix 3: Test Email Delivery
1. Go to Resend dashboard
2. Click on a sent email
3. Check the delivery status
4. Look for any error messages

## Still Not Working?

1. **Check Resend Dashboard**:
   - Go to https://resend.com/emails
   - Find your sent email
   - Check the status and any error messages

2. **Contact Resend Support**:
   - If emails show as "sent" but not delivered
   - Resend support can check their logs
   - They can tell you if there's a delivery issue

3. **Try a Different Email Service**:
   - SendGrid (free tier available)
   - AWS SES (requires AWS account)
   - See `EMAIL_SETUP.md` for instructions

## Common Error Messages

**"Invalid from address"**
- Solution: Verify your domain in Resend or use `onboarding@resend.dev`

**"Rate limit exceeded"**
- Solution: You've hit the 100 emails/day limit. Wait or upgrade plan.

**"Email bounced"**
- Solution: The email address doesn't exist. Check for typos.

**"Domain not verified"**
- Solution: Verify your domain in Resend dashboard.

## Testing Email Delivery

To test if emails are working:

1. Request a password reset
2. Check server logs for `[Email] ✅ Email sent successfully!`
3. Check Resend dashboard for the email
4. Check your inbox AND spam folder
5. If still not received, check Resend dashboard for delivery status

## Next Steps

If emails are showing as "sent" in Resend but not received:
1. ✅ Check spam folder (most common)
2. ✅ Check Resend dashboard delivery status
3. ✅ Verify email address is correct
4. ✅ Try sending to a different email address
5. ✅ Verify domain in Resend (for production)
