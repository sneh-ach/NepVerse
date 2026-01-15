# 🚀 Production Readiness Checklist

**Last Updated:** January 14, 2026

## ✅ What's Already Configured

### Code & Infrastructure
- ✅ **Next.js 14** with App Router
- ✅ **Prisma ORM** with PostgreSQL schema
- ✅ **Security Headers** (XSS, CSRF, HSTS in production)
- ✅ **CORS Configuration** (with environment-based origins)
- ✅ **Rate Limiting** (auth: 5/15min, API: 100/15min)
- ✅ **Input Validation** (Zod schemas)
- ✅ **Error Handling** (centralized error handler)
- ✅ **Logging System** (structured logging)
- ✅ **Environment Validation** (auto-checks on startup)
- ✅ **Storage Service** (S3/R2 abstraction layer)
- ✅ **Email Service** (Resend/SendGrid/AWS SES support)
- ✅ **Payment Integration** (Stripe/eSewa/Khalti)
- ✅ **JWT Authentication** (token generation/verification)
- ✅ **Password Hashing** (bcrypt)
- ✅ **Admin System** (role-based access)
- ✅ **Content Management** (CRUD operations)
- ✅ **Video Player** (HLS.js integration)
- ✅ **Image Optimization** (Next.js Image component)
- ✅ **Build Configuration** (compression, minification)

### Security Features
- ✅ Security headers middleware
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ `.env` in `.gitignore`
- ✅ Token hashing for password reset

---

## 🔴 CRITICAL - Must Configure Before Production

### 1. Environment Variables (REQUIRED)

Create a `.env` file (or set in your hosting platform):

```env
# ============================================
# REQUIRED - Must Have
# ============================================

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# JWT Secret (Generate: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"

# App URL (Your production domain)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"

# ============================================
# Email Service (Choose ONE)
# ============================================

# Option A: Resend (Recommended - Easiest)
RESEND_API_KEY="re_xxxxxxxxxxxxx"

# Option B: SendGrid
# SENDGRID_API_KEY="SG.xxxxxxxxxxxxx"

# Option C: AWS SES
# AWS_SES_ACCESS_KEY_ID="AKIAxxxxxxxxxxxxx"
# AWS_SES_SECRET_ACCESS_KEY="xxxxxxxxxxxxx"
# AWS_SES_REGION="us-east-1"

# ============================================
# Payment Gateway (At least ONE)
# ============================================

# Stripe (International)
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxxx"  # Use sk_test_ for testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxx"  # Use pk_test_ for testing
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"  # For webhook verification

# OR for Nepal
# ESEWA_SECRET_KEY="xxxxxxxxxxxxx"
# ESEWA_MERCHANT_ID="xxxxxxxxxxxxx"
# KHALTI_SECRET_KEY="xxxxxxxxxxxxx"
# KHALTI_PUBLIC_KEY="xxxxxxxxxxxxx"

# ============================================
# Storage (Choose ONE)
# ============================================

# Option A: AWS S3
S3_ACCESS_KEY_ID="AKIAxxxxxxxxxxxxx"
S3_SECRET_ACCESS_KEY="xxxxxxxxxxxxx"
S3_BUCKET="nepverse-storage"
S3_REGION="us-east-1"
CDN_URL="https://your-cloudfront-url.cloudfront.net"  # Optional but recommended

# Option B: Cloudflare R2 (Recommended - No egress fees)
R2_ACCOUNT_ID="xxxxxxxxxxxxx"
R2_ACCESS_KEY_ID="xxxxxxxxxxxxx"
R2_SECRET_ACCESS_KEY="xxxxxxxxxxxxx"
R2_BUCKET="nepverse-storage"
CDN_URL="https://your-custom-domain.com"  # Required for R2 public access

# ============================================
# CORS (Required for Production)
# ============================================
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### 2. Database Setup

**Steps:**
1. Create PostgreSQL database (Neon, Supabase, Railway, AWS RDS, etc.)
2. Get connection string
3. Run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# OR create migration (recommended for production)
npx prisma migrate dev --name init
```

**For Production:**
```bash
npx prisma migrate deploy
```

### 3. Storage Setup

**Option A: Cloudflare R2 (Recommended)**
1. Sign up at https://developers.cloudflare.com/r2
2. Create bucket: `nepverse-storage`
3. Create API token (Manage R2 API Tokens)
4. Get: Account ID, Access Key ID, Secret Access Key
5. Set up custom domain (optional but recommended for CDN)
6. Add to `.env`:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET`
   - `CDN_URL` (your custom domain)

**Option B: AWS S3**
1. Create S3 bucket
2. Create IAM user with S3 access
3. Get Access Key ID and Secret Access Key
4. Set up CloudFront distribution (optional but recommended)
5. Add to `.env`:
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET`
   - `S3_REGION`
   - `CDN_URL` (CloudFront URL)

### 4. Email Service Setup

**Resend (Easiest - Recommended)**
1. Sign up at https://resend.com
2. Get API key
3. Verify domain (for production)
4. Add `RESEND_API_KEY` to `.env`

### 5. Payment Gateway Setup

**Stripe**
1. Create account at https://stripe.com
2. Get API keys (use test keys first)
3. Set up webhook endpoint: `https://yourdomain.com/api/subscriptions/webhook`
4. Get webhook signing secret
5. Add to `.env`:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### 6. Production Domain & SSL

1. Buy domain (Namecheap, Google Domains, etc.)
2. Point DNS to your hosting provider
3. Set up SSL certificate (automatic on Vercel/Railway)
4. Update `NEXT_PUBLIC_APP_URL` in `.env`

---

## 🟡 IMPORTANT - Should Configure Soon

### 7. Error Tracking (Sentry)

**Why:** Track errors, crashes, and performance issues

**Steps:**
1. Sign up at https://sentry.io (free tier: 5,000 events/month)
2. Create Next.js project
3. Get DSN
4. Add to `.env`: `SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"`

**Note:** Sentry SDK is already installed (`@sentry/nextjs`)

### 8. Analytics (Google Analytics)

**Why:** Track user behavior and conversions

**Steps:**
1. Create GA4 property at https://analytics.google.com
2. Get Measurement ID (starts with `G-`)
3. Add to `.env`: `NEXT_PUBLIC_GA_ID="G-xxxxxxxxxxxxx"`

### 9. CORS Configuration

**Action Required:**
Add to `.env`:
```env
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

**Why:** Prevents unauthorized domains from accessing your API

---

## 🟢 OPTIONAL - Nice to Have

### 10. Redis (Caching)

**Why:** Better performance, session storage, caching

**Options:**
- Upstash (free tier: 10,000 commands/day)
- Redis Cloud (free tier: 30MB)

**Add to `.env`:**
```env
REDIS_URL="redis://default:password@host:port"
```

### 11. Search (Algolia)

**Why:** Advanced search functionality

**Steps:**
1. Sign up at https://algolia.com
2. Create application
3. Get App ID and API Key
4. Add to `.env`:
   - `NEXT_PUBLIC_ALGOLIA_APP_ID`
   - `ALGOLIA_API_KEY`

**Note:** Algolia SDK is already installed

---

## 📋 Pre-Deployment Checklist

### Before Deploying:

- [ ] All environment variables set in hosting platform
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Storage bucket created and accessible
- [ ] Email service tested (send test email)
- [ ] Payment gateway tested (test transaction)
- [ ] CORS origins configured
- [ ] Production domain configured
- [ ] SSL certificate active
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (optional)
- [ ] Build tested locally: `npm run build`
- [ ] Production build tested: `npm run start`

### Security Checklist:

- [ ] Strong `JWT_SECRET` (32+ characters)
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enforced
- [ ] Security headers verified (use https://securityheaders.com)
- [ ] Rate limiting tested
- [ ] CORS tested
- [ ] No secrets in code (all in environment variables)
- [ ] `.env` in `.gitignore` ✅ (already done)

### Performance Checklist:

- [ ] Build succeeds without errors
- [ ] Bundle size reasonable (check build output)
- [ ] Images optimized (Next.js Image component)
- [ ] Compression enabled ✅ (already in `next.config.js`)
- [ ] CDN configured for static assets
- [ ] Database indexes verified

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended for Next.js)

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Import project in Vercel

2. **Configure Environment Variables**
   - Add all variables from `.env` in Vercel dashboard
   - Set `NODE_ENV=production`

3. **Configure Build Settings**
   - Build Command: `npm run build` (includes `prisma generate`)
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Vercel will auto-deploy on push
   - Or click "Deploy" button

### Option 2: Self-Hosted (VPS)

1. **Server Setup**
   ```bash
   # Install Node.js 18+
   # Install PostgreSQL
   # Install PM2
   npm install -g pm2
   ```

2. **Clone & Setup**
   ```bash
   git clone <your-repo>
   cd NepNetflix
   npm install
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Build & Start**
   ```bash
   npm run build
   pm2 start npm --name "nepverse" -- start
   pm2 save
   pm2 startup
   ```

5. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **SSL Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🧪 Post-Deployment Testing

### Immediate Checks:

- [ ] Homepage loads: `https://yourdomain.com`
- [ ] Health check: `https://yourdomain.com/api/health`
- [ ] Sign up works
- [ ] Login works
- [ ] Password reset email received
- [ ] Video playback works
- [ ] File upload works (admin)
- [ ] Payment test transaction succeeds
- [ ] Admin dashboard accessible
- [ ] API endpoints respond correctly

### Security Testing:

- [ ] HTTPS enforced (redirects HTTP to HTTPS)
- [ ] Security headers present (check with browser dev tools)
- [ ] CORS working (test from different origin)
- [ ] Rate limiting working (test with multiple requests)
- [ ] No sensitive data in response headers

### Performance Testing:

- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Images load quickly
- [ ] Video streaming smooth
- [ ] Mobile responsive

---

## 📊 Priority Order

### 🔴 Must Have (Launch Blockers):
1. ✅ Database (PostgreSQL)
2. ✅ JWT_SECRET
3. ✅ Email service (Resend/SendGrid/SES)
4. ✅ Payment gateway (Stripe/eSewa/Khalti)
5. ✅ Storage (S3/R2)
6. ✅ Production domain
7. ✅ CORS configuration

### 🟡 Should Have (Soon):
1. Error tracking (Sentry)
2. Analytics (Google Analytics)
3. Database backups
4. Monitoring alerts

### 🟢 Nice to Have (Later):
1. Redis caching
2. Algolia search
3. Advanced monitoring
4. CDN optimization

---

## 💰 Estimated Monthly Costs

**Minimum (MVP):**
- Database (Neon): Free tier or ~$5/month
- Email (Resend): Free tier or ~$10/month
- Storage (R2): Free tier (10GB) or ~$1-5/month
- Payment (Stripe): 2.9% + $0.30 per transaction
- Hosting (Vercel): Free tier or ~$20/month
- **Total: ~$0-40/month** (mostly free tiers)

**With Growth:**
- Database: ~$20/month
- Email: ~$20/month
- Storage: ~$10-50/month
- CDN: ~$10-50/month
- Hosting: ~$20-100/month
- **Total: ~$80-240/month**

---

## 🆘 Troubleshooting

### Build Fails:
- Check environment variables are set
- Run `npx prisma generate` manually
- Check for TypeScript errors: `npm run build`

### Database Connection Fails:
- Verify `DATABASE_URL` is correct
- Check database is accessible (firewall, IP whitelist)
- Test connection: `npx prisma db pull`

### Storage Upload Fails:
- Verify storage credentials
- Check bucket permissions
- Verify bucket exists
- Check `CDN_URL` is set (for R2)

### Email Not Sending:
- Verify email service API key
- Check email service quota
- Verify sender email is verified (for production)

### Payment Not Working:
- Verify Stripe keys (test vs live)
- Check webhook endpoint is accessible
- Verify webhook secret matches

---

## 📞 Quick Reference

### Generate JWT Secret:
```bash
openssl rand -base64 32
```

### Test Database Connection:
```bash
npx prisma db pull
```

### Test Build:
```bash
npm run build
npm run start
```

### Check Environment Variables:
The app will validate on startup and show warnings for missing optional variables.

---

## ✅ Summary

**You're Ready for Production When:**
- ✅ All required environment variables are set
- ✅ Database is connected and migrations run
- ✅ Storage is configured and accessible
- ✅ Email service is working
- ✅ Payment gateway is configured
- ✅ Production domain is set up
- ✅ Build succeeds without errors
- ✅ All critical features tested

**Current Status:** Code is production-ready. You just need to configure the services and environment variables listed above.

---

**Need Help?** Check the other documentation files:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `PRODUCTION_READINESS.md` - Comprehensive checklist
- `SETUP_GUIDE.md` - Initial setup instructions
