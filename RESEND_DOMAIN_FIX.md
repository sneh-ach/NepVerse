# Fixing Resend Domain Restriction Issue

## The Problem

You're seeing this error in Resend:
```
Testing domain restriction: The resend.dev domain is for testing and can only send to your own email address.
```

This happens because:
1. **Resend's test domain (`resend.dev`) can only send to your verified account email**
2. You're trying to send to `acharyasneh007@gmail.com` which is not your Resend account email
3. The FROM address might be malformed (showing as `onboarding@` instead of `onboarding@resend.dev`)

## Solutions

### Option 1: Verify Your Own Domain (Recommended for Production)

1. **Go to Resend Dashboard**:
   - Visit https://resend.com/dashboard
   - Navigate to **Domains** section
   - Click **Add Domain**

2. **Add Your Domain**:
   - Enter your domain (e.g., `nepverse.com` or `nepverse.vercel.app`)
   - Resend will provide DNS records to add

3. **Add DNS Records**:
   - Go to your domain's DNS settings
   - Add the SPF, DKIM, and DMARC records Resend provides
   - Wait for verification (usually a few minutes to a few hours)

4. **Update Environment Variable**:
   ```bash
   EMAIL_FROM="NepVerse <noreply@yourdomain.com>"
   ```
   - Update in your `.env` file
   - Update in Vercel environment variables
   - Redeploy your app

### Option 2: Use Your Resend Account Email (For Testing)

If you just want to test, you can temporarily send emails only to your Resend account email:

1. **Find Your Resend Account Email**:
   - Go to Resend dashboard → Settings
   - Check your verified email address

2. **Test with That Email**:
   - Only request password resets for your Resend account email
   - This will work with `resend.dev` domain

### Option 3: Check FROM Email Format

Make sure your `.env` file has the correct format:

```bash
# ✅ Correct
EMAIL_FROM="NepVerse <onboarding@resend.dev>"

# ❌ Wrong (missing domain)
EMAIL_FROM="NepVerse <onboarding@>"

# ❌ Wrong (no quotes needed, but works)
EMAIL_FROM=NepVerse <onboarding@resend.dev>
```

## Quick Fix for Vercel

If you're deploying to Vercel:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add/Update**:
   - Key: `EMAIL_FROM`
   - Value: `NepVerse <onboarding@resend.dev>` (for testing)
   - Or: `NepVerse <noreply@yourdomain.com>` (if domain verified)
3. **Redeploy** your application

## Why This Happens

Resend's free tier includes:
- **Test domain (`resend.dev`)**: Can only send to your verified account email
- **Verified domains**: Can send to any email address

This is a security measure to prevent spam. Once you verify your own domain, you can send to any email address.

## Current Status

- ✅ Code now validates FROM email format
- ✅ Better error messages for domain restrictions
- ⚠️ You need to either:
  - Verify your domain in Resend, OR
  - Only send to your Resend account email for testing

## Next Steps

1. **For Production**: Verify your domain in Resend (Option 1)
2. **For Testing**: Use your Resend account email (Option 2)
3. **Check Vercel**: Make sure `EMAIL_FROM` is set correctly in environment variables
