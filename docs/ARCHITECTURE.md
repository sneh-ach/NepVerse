# NepVerse Architecture Documentation

## System Architecture Overview

NepVerse is built as a modern full-stack Next.js application using the App Router pattern. The architecture follows a layered approach with clear separation of concerns.

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Location**: `app/`, `components/`

- **Pages**: Next.js App Router pages (`app/*/page.tsx`)
- **Components**: Reusable React components (`components/`)
- **Hooks**: Custom React hooks (`hooks/`)
- **Styling**: Tailwind CSS with custom theme

**Key Components**:
- `Header`: Navigation and user menu
- `Footer`: Site footer with links
- `HeroBanner`: Featured content display
- `ContentCarousel`: Horizontal scrolling content lists
- `VideoPlayer`: HLS video player with controls

### 2. API Layer (Backend)

**Location**: `app/api/`

RESTful API routes organized by domain:

- **Authentication** (`/api/auth/*`): Login, signup, logout, session management
- **Content** (`/api/content/*`): Movies, series, search, recommendations
- **Watch** (`/api/watch/*`): Watch history, watchlist
- **Subscriptions** (`/api/subscriptions/*`): Subscription management, webhooks
- **Admin** (`/api/admin/*`): Admin operations, content management

### 3. Business Logic Layer

**Location**: `lib/`

- **auth.ts**: JWT token generation/verification, password hashing
- **payment.ts**: Payment provider abstraction (Stripe, local)
- **storage.ts**: Cloud storage abstraction (S3-compatible)
- **prisma.ts**: Database client singleton

### 4. Data Access Layer

**Location**: `prisma/`

- **schema.prisma**: Database schema definition
- Prisma Client: Type-safe database access

## Data Flow

### Authentication Flow

```
User → Login Page → POST /api/auth/login
  → Verify credentials → Generate JWT
  → Set HTTP-only cookie → Return user data
  → Client stores user in SWR cache
```

### Content Streaming Flow

```
User → Watch Page → GET /api/content/movie/:id
  → Verify subscription → Return video URLs
  → Client loads HLS.js → Stream video
  → Update watch history on time updates
```

### Subscription Flow

```
User → Pricing Page → POST /api/subscriptions/create
  → Create Stripe Checkout → Redirect to Stripe
  → User completes payment → Stripe webhook
  → Update subscription in DB → Activate access
```

## Security Architecture

### Authentication

- **JWT Tokens**: Stored in HTTP-only cookies
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: 7 days (configurable)
- **Middleware**: Route protection via Next.js middleware

### Authorization

- **Role-based**: Admin vs. regular user (extensible)
- **Resource-based**: Users can only access their own data
- **Subscription-based**: Content access requires active subscription

### Data Protection

- **SQL Injection**: Prisma ORM prevents SQL injection
- **XSS**: React automatically escapes content
- **CSRF**: SameSite cookies, token validation
- **Rate Limiting**: Should be added in production

## Database Design

### Relationships

```
User (1) ── (1) Profile
User (1) ── (*) Subscription
User (1) ── (*) Payment
User (1) ── (*) WatchHistory
User (1) ── (*) WatchList

Movie (*) ── (*) Genre
Series (*) ── (*) Genre
Series (1) ── (*) Episode

WatchHistory ── (1) Movie (optional)
WatchHistory ── (1) Series (optional)
WatchHistory ── (1) Episode (optional)
```

### Indexing Strategy

- **User**: Indexed on email, phone
- **Content**: Indexed on isPublished, isFeatured, releaseDate
- **WatchHistory**: Indexed on userId, lastWatchedAt
- **Subscriptions**: Indexed on userId, status

## Video Streaming Architecture

### HLS Implementation

1. **Video Encoding**: Videos encoded to HLS format (m3u8 + segments)
2. **Multi-quality**: Separate streams for 360p, 720p, 1080p
3. **Client-side**: HLS.js library handles adaptive streaming
4. **Storage**: Cloud storage (S3) with signed URLs for security

### Subtitle Support

- **Format**: WebVTT
- **Languages**: Nepali, English
- **Delivery**: Separate subtitle files, loaded on demand

## Payment Architecture

### Provider Abstraction

```
PaymentProvider Interface
  ├── StripePaymentProvider (International)
  └── LocalPaymentProvider (Nepal - eSewa/Khalti)
```

### Flow

1. User selects plan
2. System determines country
3. Appropriate provider selected
4. Payment processed
5. Webhook updates subscription

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: All routes are stateless
- **Database**: PostgreSQL can be replicated
- **CDN**: Static assets and videos via CDN
- **Caching**: SWR for client-side, Redis for server-side (future)

### Performance Optimization

- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic with Next.js
- **Lazy Loading**: Components loaded on demand
- **Database Queries**: Optimized with Prisma, proper indexing

## Deployment Architecture

### Recommended Setup

```
┌─────────────┐
│   CDN       │ (Static assets, videos)
└─────────────┘
       │
┌─────────────┐
│   Next.js   │ (Vercel/AWS)
│   App       │
└─────────────┘
       │
┌─────────────┐
│ PostgreSQL  │ (Managed DB)
└─────────────┘
       │
┌─────────────┐
│   S3/Cloud  │ (Video storage)
└─────────────┘
```

## Monitoring & Observability

### Recommended Tools

- **Error Tracking**: Sentry
- **Analytics**: Google Analytics / Plausible
- **Logging**: Winston / Pino
- **APM**: New Relic / Datadog
- **Uptime**: UptimeRobot

## Future Enhancements

1. **Caching Layer**: Redis for session and content caching
2. **Search**: Elasticsearch for advanced search
3. **Recommendations**: ML-based recommendation engine
4. **CDN**: CloudFront/Cloudflare for global content delivery
5. **Microservices**: Split admin, content, and user services
6. **Queue System**: Bull/BullMQ for background jobs
7. **Real-time**: WebSockets for live features




