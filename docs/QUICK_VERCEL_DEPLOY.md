# ⚡ Quick Vercel Deployment (5 Minutes)

## 🚀 Fast Track Steps

### 1. Push to GitHub (2 min)
```bash
git add .
git commit -m "Ready for Vercel"
git push
```

### 2. Deploy on Vercel (3 min)

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repo
4. Add these environment variables:

```env
DATABASE_URL=your-neon-connection-string
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NODE_ENV=production
RESEND_API_KEY=your-resend-key
STRIPE_SECRET_KEY=your-stripe-test-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET=nepverse-storage
ALLOWED_ORIGINS=https://your-project.vercel.app
```

5. Click **"Deploy"**
6. Wait 2-3 minutes
7. Done! 🎉

### 3. Update After First Deploy

After Vercel gives you a URL, update:
- `NEXT_PUBLIC_APP_URL` → Your actual Vercel URL
- `ALLOWED_ORIGINS` → Your actual Vercel URL
- Click **"Redeploy"**

### 4. Run Migrations

```bash
# Make sure DATABASE_URL is in your local .env
npx prisma migrate deploy
```

### 5. Share URL

Give testers:
- **URL:** `https://your-project.vercel.app`
- **Test Account:** Create one for them
- **Test Card:** `4242 4242 4242 4242` (if testing payments)

---

## ✅ That's It!

Your app is live and ready for manual testing! 🚀

**Need detailed steps?** See `VERCEL_DEPLOYMENT_GUIDE.md`
