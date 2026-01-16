# Email Setup Guide for Password Reset

This guide will help you configure email sending for password reset functionality.

## Option 1: Resend (Recommended - Easiest)

Resend is the easiest email service to set up and works great for development and production.

### Step 1: Create a Resend Account
1. Go to https://resend.com
2. Sign up for a free account (no credit card required)
3. Verify your email address

### Step 2: Get Your API Key
1. After logging in, go to **API Keys** in the sidebar
2. Click **Create API Key**
3. Give it a name (e.g., "NepVerse Production")
4. Copy the API key (it starts with `re_`)

### Step 3: Add to Your .env File
1. Open your `.env` file in the project root
2. Add this line:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```
3. Replace `re_your_api_key_here` with your actual API key from Resend

### Step 4: Restart Your Server
```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 5: Test It
1. Go to `/forgot-password` on your site
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email inbox (and spam folder)
5. You should receive the password reset email!

### Resend Free Tier Limits
- 3,000 emails per month (free)
- 100 emails per day
- Perfect for development and small projects

---

## Option 2: SendGrid

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for a free account
3. Verify your email

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Give it a name and select **Full Access** or **Mail Send** permissions
4. Copy the API key

### Step 3: Add to .env
```
SENDGRID_API_KEY=SG.your_api_key_here
```

### Step 4: Restart Server
```bash
npm run dev
```

---

## Option 3: AWS SES

### Step 1: Set Up AWS Account
1. Create an AWS account
2. Go to AWS SES (Simple Email Service)
3. Verify your email address or domain

### Step 2: Create IAM User
1. Go to IAM → Users
2. Create a new user with SES sending permissions
3. Create access keys

### Step 3: Add to .env
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_REGION=us-east-1
```

---

## Verification Steps

### Check if Email Service is Configured

1. **Check Server Logs**: When you start your server, you should see:
   ```
   [Email] Initializing Resend with API key: re_xxxxx...
   ```
   If you see warnings about no email provider, the API key isn't set correctly.

2. **Test Password Reset**:
   - Go to `/forgot-password`
   - Enter your email
   - Check server console for:
     ```
     [Email] ✅ Email sent successfully!
     [Email]   Message ID: xxxxx
     ```
   - If you see `❌ FAILED`, check the error message

3. **Check Your Email**:
   - Check inbox
   - Check spam/junk folder
   - The email should come from `NepVerse <onboarding@resend.dev>` (if using Resend)

---

## Troubleshooting

### Email Not Sending?

1. **Check .env file**:
   - Make sure `RESEND_API_KEY` is set (no quotes, no spaces)
   - Restart server after adding it

2. **Check Server Logs**:
   - Look for `[Email]` messages in console
   - Check for error messages

3. **Verify API Key**:
   - Make sure you copied the full API key
   - API key should start with `re_` for Resend

4. **Check Email Service Status**:
   - For Resend: Check your Resend dashboard for any issues
   - Make sure your account is verified

5. **Development Mode**:
   - If email isn't configured, the reset link will be shown on the success page
   - Check server console for the reset link

### Common Errors

**Error: "RESEND_API_KEY not found"**
- Solution: Add `RESEND_API_KEY` to your `.env` file and restart server

**Error: "Invalid API key"**
- Solution: Double-check your API key in Resend dashboard

**Email goes to spam**:
- Solution: This is normal for development. In production, verify your domain with Resend

---

## Production Setup

For production, you should:

1. **Verify Your Domain** (Resend):
   - Go to Resend dashboard → Domains
   - Add and verify your domain
   - Update `EMAIL_FROM` in `.env` to use your domain:
     ```
     EMAIL_FROM=NepVerse <noreply@yourdomain.com>
     ```

2. **Set Environment Variables in Vercel**:
   - Go to your Vercel project settings
   - Add `RESEND_API_KEY` in Environment Variables
   - Redeploy your app

---

## Quick Start (Resend)

1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env`: `RESEND_API_KEY=re_xxxxx`
4. Restart server: `npm run dev`
5. Test at `/forgot-password`

That's it! 🎉
