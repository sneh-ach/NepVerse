# 🔑 Vercel Environment Variables - Copy & Paste

**Copy these directly into Vercel Dashboard → Settings → Environment Variables**

---

## 📋 Step 1: Add These Variables

Click "Add New" for each variable in Vercel:

### 1. Database
```
DATABASE_URL
```
```
postgresql://neondb_owner:npg_WshMa9JRkoi5@ep-restless-forest-ah1kt89s-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. JWT Secret
```
JWT_SECRET
```
```
HWJx93qkdxzHUEGPGTDlA70BODPmuHKWeeuDeaHdzEE=
```

### 3. App URL (Update after deployment)
```
NEXT_PUBLIC_APP_URL
```
```
https://your-project-name.vercel.app
```
*⚠️ Update this after first deployment with your actual Vercel URL*

### 4. Node Environment
```
NODE_ENV
```
```
production
```

### 5. Email Service (Resend)
```
RESEND_API_KEY
```
```
re_MLrvnepS_S5oFes2yKHKjuBQm8vihwyzo
```

### 6. Payment Gateway - Secret Key
```
STRIPE_SECRET_KEY
```
```
YOUR_STRIPE_SECRET_KEY_HERE
```
*⚠️ Replace with your actual Stripe test secret key from Stripe dashboard*

### 7. Payment Gateway - Publishable Key
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
```
YOUR_STRIPE_PUBLISHABLE_KEY_HERE
```
*⚠️ Replace with your actual Stripe test publishable key from Stripe dashboard*

### 8. Storage - R2 Account ID
```
R2_ACCOUNT_ID
```
```
fbdee46a9b838de85e14cf5a4ef887b8
```

### 9. Storage - R2 Access Key
```
R2_ACCESS_KEY_ID
```
```
YOUR_R2_ACCESS_KEY_HERE
```
*⚠️ Replace with your actual R2 access key from Cloudflare dashboard*

### 10. Storage - R2 Secret Key
```
R2_SECRET_ACCESS_KEY
```
```
YOUR_R2_SECRET_KEY_HERE
```
*⚠️ Replace with your actual R2 secret key from Cloudflare dashboard*

### 11. Storage - R2 Bucket
```
R2_BUCKET
```
```
nepverse-storage
```

### 12. CORS Origins (Update after deployment)
```
ALLOWED_ORIGINS
```
```
https://your-project-name.vercel.app
```
*⚠️ Update this after first deployment with your actual Vercel URL*

---

## 📝 Step 2: After First Deployment

Once Vercel gives you a URL (like `https://nepverse-abc123.vercel.app`):

1. Go back to **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Update `ALLOWED_ORIGINS` to your actual Vercel URL
4. Click **"Redeploy"** to apply changes

---

## ✅ Quick Checklist

- [ ] All 12 variables added to Vercel
- [ ] Deployed successfully
- [ ] Got Vercel URL
- [ ] Updated `NEXT_PUBLIC_APP_URL` with actual URL
- [ ] Updated `ALLOWED_ORIGINS` with actual URL
- [ ] Redeployed

---

**That's it! Your app should be live and ready for testing! 🚀**
