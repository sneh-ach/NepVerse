# 🎬 NepVerse - Nepali Streaming Platform

A modern Netflix-like streaming platform built with Next.js 14, featuring Nepali movies and series.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon, Supabase, or similar)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

Visit http://localhost:3000

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with bcrypt
- **Storage:** Cloudflare R2 / AWS S3
- **Email:** Resend / SendGrid / AWS SES
- **Payment:** Stripe / eSewa / Khalti
- **Styling:** Tailwind CSS
- **Video:** HLS.js for streaming

## 🔧 Environment Variables

See `VERCEL_ENV_VARS.md` for complete list of required environment variables.

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random secure string (32+ chars)
- `NEXT_PUBLIC_APP_URL` - Your app URL
- Email service (Resend/SendGrid/SES)
- Storage (R2/S3)
- Payment gateway (Stripe/eSewa/Khalti)

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (see `VERCEL_ENV_VARS.md`)
4. Deploy!

See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📚 Documentation

All documentation is in the [`docs/`](./docs/) folder:

- [`docs/VERCEL_DEPLOYMENT_GUIDE.md`](./docs/VERCEL_DEPLOYMENT_GUIDE.md) - Complete Vercel deployment guide
- [`docs/VERCEL_ENV_VARS.md`](./docs/VERCEL_ENV_VARS.md) - Environment variables for Vercel (copy-paste ready)
- [`docs/QUICK_VERCEL_DEPLOY.md`](./docs/QUICK_VERCEL_DEPLOY.md) - 5-minute quick deployment
- [`docs/PRODUCTION_CHECKLIST.md`](./docs/PRODUCTION_CHECKLIST.md) - Production readiness checklist
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - Technical architecture
- [`docs/FEATURES.md`](./docs/FEATURES.md) - Complete feature list

## 🎯 Features

- ✅ User authentication & profiles
- ✅ Content management (movies & series)
- ✅ Video streaming (HLS)
- ✅ Admin dashboard
- ✅ Payment integration
- ✅ Watch history & lists
- ✅ Search & filters
- ✅ Responsive design

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push Prisma schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run seed         # Seed database with sample data
npm run grant-admin  # Grant admin access to a user
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ for Nepali content**
