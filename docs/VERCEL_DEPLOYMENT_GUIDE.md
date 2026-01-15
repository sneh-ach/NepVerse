# 🚀 Vercel Deployment Guide - For Manual Testing

**Goal:** Deploy to Vercel so others can test manually (payment setup can wait)

---

## 📋 Pre-Deployment Checklist

### What You Need:
- ✅ GitHub/GitLab account (to connect repository)
- ✅ Vercel account (free tier works)
- ✅ All your environment variables ready

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/nepverse.git
git branch -M main
git push -u origin main
```

### Step 2: Sign Up / Login to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub (recommended) or email
3. Complete setup

### Step 3: Import Project

1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Select your repository
4. Click **"Import"**

### Step 4: Configure Project Settings

Vercel will auto-detect Next.js, but verify:

- **Framework Preset:** Next.js ✅
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

### Step 5: Add Environment Variables

**This is the most important step!**

Click **"Environment Variables"** and add ALL of these:

#### Required Variables:

```env
# Database
DATABASE_URL=postgresql://neondb_... (your existing connection string)

# JWT
JWT_SECRET=HWJx93qkdxzHUEGPGTDl... (your existing secret)

# App URL (will be your Vercel URL)
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app

# Node Environment
NODE_ENV=production
```

#### Email Service:

```env
RESEND_API_KEY=re_MLrvnepS_S5o... (your existing key)
```

#### Payment Gateway (Test Mode - OK for Testing):

```env
STRIPE_SECRET_KEY=sk_test_... (your test key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (your test key)
# Webhook secret not needed for manual testing
```

#### Storage (R2):

```env
R2_ACCOUNT_ID=fbdee46a9b... (your account ID)
R2_ACCESS_KEY_ID=... (your access key)
R2_SECRET_ACCESS_KEY=... (your secret key)
R2_BUCKET=nepverse-storage
# CDN_URL optional for now
```

#### CORS (Important for Testing):

```env
ALLOWED_ORIGINS=https://your-project-name.vercel.app,https://www.your-project-name.vercel.app
```

**Note:** Replace `your-project-name` with your actual Vercel project name.

### Step 6: Deploy!

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. You'll see a URL like: `https://your-project-name.vercel.app`

### Step 7: Update Environment Variables After First Deploy

After deployment, Vercel will give you a URL. Update:

1. Go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Update `ALLOWED_ORIGINS` to include your Vercel URL
4. Click **"Redeploy"** to apply changes

---

## 🗄️ Database Setup on Vercel

### Run Database Migrations

After first deployment, you need to run migrations:

**Option 1: Via Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migrations (this runs in Vercel environment)
vercel env pull .env.local
npx prisma migrate deploy
```

**Option 2: Via Vercel Dashboard**

1. Go to your project on Vercel
2. Click **"Settings"** → **"Functions"**
3. Create a temporary API route to run migrations (or use Vercel CLI)

**Option 3: Run Locally (Easier)**

Since your database is already set up, you can run:

```bash
# Make sure DATABASE_URL is set in your local .env
npx prisma migrate deploy
```

This will apply any pending migrations to your database.

---

## 🧪 Testing Checklist

After deployment, test these:

### Basic Functionality:
- [ ] Homepage loads: `https://your-project.vercel.app`
- [ ] Sign up works
- [ ] Login works
- [ ] Profile creation works
- [ ] Browse page loads
- [ ] Content cards display

### Admin Features:
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] Content upload works (test with small image)
- [ ] Content editing works

### Email (If Configured):
- [ ] Password reset email sends
- [ ] Check Resend dashboard for email logs

### Storage (If Testing Uploads):
- [ ] File upload works
- [ ] Images display correctly
- [ ] Check R2 bucket for uploaded files

### Payment (Test Mode):
- [ ] Payment page loads
- [ ] Test card works: `4242 4242 4242 4242`
- [ ] Subscription flow works (test mode)

---

## 🔗 Share with Testers

### Give Them:
1. **URL:** `https://your-project-name.vercel.app`
2. **Test Account Credentials** (create one for them):
   ```
   Email: tester@example.com
   Password: Test1234!
   ```
3. **Test Payment Card** (if testing payments):
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ```

### What They Can Test:
- ✅ Sign up / Login
- ✅ Profile creation
- ✅ Browse content
- ✅ Watch videos (if uploaded)
- ✅ Admin features (if you give admin access)
- ✅ Payment flow (test mode - no real charges)

---

## ⚙️ Vercel Settings to Configure

### 1. Custom Domain (Optional)

If you have a domain:
1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` and `ALLOWED_ORIGINS`

### 2. Environment Variables per Environment

Vercel supports different env vars for:
- **Production:** `https://your-project.vercel.app`
- **Preview:** Each PR gets a preview URL
- **Development:** Local development

Set variables for **Production** (and optionally Preview).

### 3. Build Settings

Verify in **Settings** → **General**:
- **Node.js Version:** 18.x or 20.x (Vercel auto-detects)
- **Build Command:** `npm run build` (includes `prisma generate`)
- **Output Directory:** `.next`

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found" or "Prisma Client not generated"
- **Fix:** Vercel should run `prisma generate` automatically (it's in your build script)
- Check build logs in Vercel dashboard

**Error:** "Environment variable missing"
- **Fix:** Make sure ALL required env vars are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)

### Database Connection Fails

**Error:** "Can't reach database server"
- **Fix:** Check `DATABASE_URL` is correct in Vercel
- Verify Neon database allows connections from Vercel IPs
- Check Neon dashboard for connection issues

### CORS Errors

**Error:** "CORS policy blocked"
- **Fix:** Update `ALLOWED_ORIGINS` to include your Vercel URL
- Make sure it includes both `https://your-project.vercel.app` and `https://www.your-project.vercel.app` if using www

### Images Not Loading

**Error:** Images show broken
- **Fix:** Check R2 storage is configured
- Verify `CDN_URL` is set (or app will use proxy endpoint)
- Check Next.js image domains in `next.config.js`

---

## 📝 Quick Reference

### Environment Variables Checklist:

Copy these to Vercel (with your actual values):

```env
# Required
DATABASE_URL=...
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NODE_ENV=production

# Email
RESEND_API_KEY=...

# Payment (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=nepverse-storage

# CORS
ALLOWED_ORIGINS=https://your-project.vercel.app
```

### After Deployment:

1. ✅ Test homepage loads
2. ✅ Test sign up / login
3. ✅ Test admin features
4. ✅ Share URL with testers
5. ✅ Monitor Vercel logs for errors

---

## 🎯 Next Steps After Deployment

1. **Test Everything Locally First**
   - Make sure `npm run build` works locally
   - Fix any build errors before deploying

2. **Deploy to Vercel**
   - Follow steps above
   - Wait for build to complete

3. **Run Database Migrations**
   - Use Vercel CLI or run locally with production DATABASE_URL

4. **Test on Vercel URL**
   - Go through all features
   - Check for errors in Vercel logs

5. **Share with Testers**
   - Give them URL and test credentials
   - Collect feedback

6. **Monitor**
   - Check Vercel dashboard for errors
   - Monitor Resend dashboard for email issues
   - Check Neon dashboard for database issues

---

## 💡 Pro Tips

1. **Use Preview Deployments**
   - Each PR gets a preview URL
   - Test changes before merging to main

2. **Set Up Vercel CLI**
   - Easier to manage environment variables
   - Can run commands in Vercel environment

3. **Monitor Logs**
   - Vercel dashboard shows real-time logs
   - Check for errors during testing

4. **Use Vercel Analytics** (Optional)
   - Free tier available
   - Track page views and performance

5. **Set Up Alerts**
   - Get notified of build failures
   - Monitor error rates

---

## ✅ You're Ready!

Once deployed, you'll have:
- ✅ Live URL to share
- ✅ All features working (test mode)
- ✅ Ready for manual testing
- ✅ Payment can be set up later

**Deploy now and share the URL with your testers!** 🚀
