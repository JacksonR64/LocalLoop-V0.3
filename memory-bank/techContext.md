# ⚙️ Tech Context - LocalLoop Technical Architecture & Implementation

## 🔧 Complete Tech Stack & Architecture

### Frontend Technology Stack

#### Core Framework & Language
**Next.js 15 with TypeScript (1000x-app template foundation)**
- **Server-Side Rendering (SSR):** For SEO optimization and fast initial page loads
- **Incremental Static Regeneration (ISR):** For homepage and filter pages caching
- **Edge Runtime:** For serverless functions and API routes
- **TypeScript:** Strict type checking with comprehensive type definitions
- **React 18:** With concurrent features and Suspense boundaries

#### Styling & UI Framework
**Tailwind CSS 4 Implementation:**
- **Design System:** Consistent color palette, typography, and spacing scale
- **Responsive Breakpoints:** Mobile (320px-639px), Tablet (640px-1023px), Desktop (1024px+)
- **Component Library:** Reusable UI components (buttons, forms, cards, modals)
- **Dark Mode Support:** Built-in dark mode with system preference detection
- **Custom Components:** Event cards, calendar widgets, dashboard layouts

#### State Management & Data Fetching
**TanStack Query (React Query) v5:**
- **Caching Strategy:** Smart caching with stale-while-revalidate patterns
- **Background Updates:** Automatic refetching for real-time dashboard updates
- **Optimistic Updates:** Immediate UI feedback for RSVP and ticketing actions
- **Error Handling:** Comprehensive error boundaries with retry mechanisms
- **Offline Support:** Query persistence for offline functionality

#### Form Handling & Validation
**React Hook Form v7 with Zod Schema Validation:**
- **Event Creation Forms:** Multi-step event creation with validation
- **User Registration:** Email/password and profile forms
- **Payment Forms:** Stripe Elements integration with custom styling
- **Real-time Validation:** Field-level validation with helpful error messages
- **TypeScript Integration:** Full type safety from form to API

#### Calendar & Date Management
**Google Calendar API Integration (Primary Requirement):**
- **Google Calendar API:** Direct integration for adding events to Google Calendar
- **OAuth 2.0 Flow:** Google authentication for calendar access permissions
- **Event Creation:** Programmatic event creation in user's Google Calendar
- **Calendar Permissions:** Proper scope management for calendar access

**Date-fns Library for Date Manipulation:**
- **Timezone Handling:** Proper timezone conversion and display
- **Calendar Integration:** Generate .ics files as fallback for other calendar apps
- **Date Formatting:** Locale-aware date and time formatting
- **Recurring Events:** Date calculation for event series (future feature)

#### Maps & Location Services
**Mapbox GL JS Integration:**
- **Interactive Maps:** Event location display with custom markers
- **Geocoding:** Address to coordinates conversion
- **Directions:** Integration with navigation apps
- **Mobile Optimization:** Touch-friendly map interaction
- **Accessibility:** Keyboard navigation and screen reader support

#### Icons & Visual Assets
**Lucide React Icon Library:**
- **Consistent Icon Set:** Comprehensive icon library with consistent style
- **SVG Optimization:** Lightweight, scalable icons
- **Accessibility:** Proper ARIA labels and semantic usage
- **Customization:** Easy sizing and coloring integration

### Backend & Database Architecture

#### Supabase Backend Services
**PostgreSQL Database with Advanced Features:**
- **Row-Level Security (RLS):** Granular access control for all tables
- **Real-time Subscriptions:** Live updates for dashboard and event changes
- **Full-text Search:** Advanced search capabilities across event content
- **JSON/JSONB Support:** Flexible data storage for event metadata
- **Computed Columns:** Derived fields for event status and capacity calculations
- **Database Functions:** Custom PostgreSQL functions for complex queries

#### Database Schema Design

**Users Table Structure:**
```sql
users {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  email: text UNIQUE NOT NULL,
  display_name: text,
  avatar_url: text,
  role: text DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'admin')),
  email_verified: boolean DEFAULT false,
  email_preferences: jsonb DEFAULT '{"marketing": false, "events": true, "reminders": true}',
  last_login: timestamp,
  deleted_at: timestamp
}
```

**Events Table with Full Schema:**
```sql
events {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  title: text NOT NULL,
  slug: text UNIQUE NOT NULL,
  description: text NOT NULL,
  short_description: text,
  start_time: timestamp with time zone NOT NULL,
  end_time: timestamp with time zone NOT NULL,
  timezone: text NOT NULL,
  location: text,
  location_details: text,
  latitude: decimal(10, 8),
  longitude: decimal(11, 8),
  is_online: boolean DEFAULT false,
  online_url: text,
  category: text NOT NULL CHECK (category IN ('workshop', 'meeting', 'social', 'arts', 'sports', 'family', 'business', 'education', 'other')),
  capacity: integer,
  is_paid: boolean DEFAULT false,
  organizer_id: uuid REFERENCES users(id) ON DELETE CASCADE,
  image_url: text,
  image_alt_text: text,
  featured: boolean DEFAULT false,
  published: boolean DEFAULT true,
  cancelled: boolean DEFAULT false,
  tags: text[],
  metadata: jsonb DEFAULT '{}',
  view_count: integer DEFAULT 0,
  -- Computed columns
  status: text GENERATED ALWAYS AS (
    CASE 
      WHEN cancelled THEN 'cancelled'
      WHEN start_time > now() THEN 'upcoming'
      WHEN start_time <= now() AND end_time >= now() THEN 'in_progress'
      ELSE 'past'
    END
  ) STORED,
  spots_remaining: integer GENERATED ALWAYS AS (
    CASE 
      WHEN capacity IS NULL THEN NULL
      ELSE capacity - (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed')
    END
  ) STORED
}
```

**RSVP System Schema:**
```sql
rsvps {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  event_id: uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id: uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_email: text,
  guest_name: text,
  status: text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
  check_in_time: timestamp,
  notes: text,
  metadata: jsonb DEFAULT '{}',
  CONSTRAINT rsvp_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR 
    (user_id IS NULL AND guest_email IS NOT NULL)
  ),
  UNIQUE(event_id, user_id),
  UNIQUE(event_id, guest_email)
}
```

**Ticketing System Schema:**
```sql
ticket_types {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at: timestamp DEFAULT now(),
  event_id: uuid REFERENCES events(id) ON DELETE CASCADE,
  name: text NOT NULL,
  description: text,
  price: integer NOT NULL, -- in cents
  capacity: integer,
  sort_order: integer DEFAULT 0,
  sale_start: timestamp,
  sale_end: timestamp,
  metadata: jsonb DEFAULT '{}'
}

orders {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now(),
  user_id: uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_email: text,
  guest_name: text,
  event_id: uuid REFERENCES events(id) ON DELETE CASCADE,
  status: text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed', 'cancelled')),
  total_amount: integer NOT NULL, -- in cents
  currency: text DEFAULT 'USD',
  stripe_payment_intent_id: text,
  stripe_session_id: text,
  refunded_at: timestamp,
  refund_amount: integer DEFAULT 0,
  metadata: jsonb DEFAULT '{}',
  CONSTRAINT order_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR 
    (user_id IS NULL AND guest_email IS NOT NULL)
  )
}

tickets {
  id: uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at: timestamp DEFAULT now(),
  order_id: uuid REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id: uuid REFERENCES ticket_types(id) ON DELETE CASCADE,
  quantity: integer NOT NULL DEFAULT 1,
  unit_price: integer NOT NULL, -- in cents
  attendee_name: text,
  attendee_email: text,
  confirmation_code: text UNIQUE NOT NULL DEFAULT generate_confirmation_code(),
  qr_code_data: text,
  check_in_time: timestamp,
  metadata: jsonb DEFAULT '{}'
}
```

#### Database Indexing Strategy
**Performance Optimization Indexes:**
```sql
-- Event discovery and filtering
CREATE INDEX idx_events_start_time ON events(start_time) WHERE published = true AND cancelled = false;
CREATE INDEX idx_events_category ON events(category) WHERE published = true;
CREATE INDEX idx_events_location ON events(location) WHERE published = true;
CREATE INDEX idx_events_featured ON events(featured, start_time) WHERE published = true;

-- Full-text search
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || description));

-- RSVP and capacity tracking
CREATE INDEX idx_rsvps_event_status ON rsvps(event_id, status);
CREATE INDEX idx_rsvps_user ON rsvps(user_id) WHERE status = 'confirmed';

-- Ticketing and orders
CREATE INDEX idx_orders_user ON orders(user_id) WHERE status = 'completed';
CREATE INDEX idx_orders_event ON orders(event_id, status);
CREATE INDEX idx_tickets_confirmation ON tickets(confirmation_code);
```

#### Row-Level Security Policies
**Comprehensive Security Implementation:**
```sql
-- Events: Public read, organizer/admin write
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (published = true);
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their events" ON events FOR UPDATE USING (auth.uid() = organizer_id);

-- RSVPs: User can manage their own
CREATE POLICY "Users can view their RSVPs" ON rsvps FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id)
);
CREATE POLICY "Users can create RSVPs" ON rsvps FOR INSERT WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Orders: User can view their own, organizers can view for their events
CREATE POLICY "Users can view their orders" ON orders FOR SELECT USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id)
);
```

### Authentication & Authorization

#### Supabase Auth Configuration
**Multi-Provider Authentication:**
- **Email/Password:** Secure authentication with bcrypt hashing
- **Google OAuth:** Streamlined social login integration
- **Apple OAuth:** iOS-optimized authentication flow
- **Magic Links:** Passwordless login option for enhanced UX
- **Email Verification:** Required for account activation

**Session Management:**
- **JWT Tokens:** Secure, stateless session handling
- **Refresh Tokens:** Automatic session renewal
- **Security Headers:** CSRF protection and secure cookies
- **Session Timeout:** Configurable session expiration
- **Multi-device Support:** Concurrent sessions across devices

#### Role-Based Access Control
**User Role Hierarchy:**
```typescript
enum UserRole {
  USER = 'user',           // Can RSVP, purchase tickets, view events
  ORGANIZER = 'organizer', // Can create and manage events
  ADMIN = 'admin'          // Full system access
}

interface RolePermissions {
  canCreateEvents: boolean;
  canManageAllEvents: boolean;
  canAccessAdminPanel: boolean;
  canProcessRefunds: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
}
```

### Payment Processing & Financial Integration

#### Stripe Integration Architecture
**Complete Payment Flow Implementation:**
```typescript
// Stripe configuration
const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  currency: 'USD',
  paymentMethods: ['card', 'apple_pay', 'google_pay'],
  captureMethod: 'automatic'
};

// Payment Intent creation
interface CreatePaymentIntent {
  amount: number; // in cents
  currency: string;
  eventId: string;
  ticketTypes: Array<{
    ticketTypeId: string;
    quantity: number;
    unitPrice: number;
  }>;
  customerEmail?: string;
  metadata: {
    eventId: string;
    orderId: string;
    userId?: string;
  };
}
```

**Webhook Handling System:**
```typescript
// Webhook event processing
interface WebhookHandler {
  'payment_intent.succeeded': (event: Stripe.PaymentIntentSucceededEvent) => Promise<void>;
  'payment_intent.payment_failed': (event: Stripe.PaymentIntentPaymentFailedEvent) => Promise<void>;
  'charge.dispute.created': (event: Stripe.ChargeDisputeCreatedEvent) => Promise<void>;
  'invoice.payment_succeeded': (event: Stripe.InvoicePaymentSucceededEvent) => Promise<void>;
}

// Refund processing
interface RefundRequest {
  paymentIntentId: string;
  amount?: number; // partial refunds
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent';
  metadata: {
    orderId: string;
    eventId: string;
    refundedBy: string;
  };
}
```

### API Architecture & Specifications

#### RESTful API Endpoints
**Event Management APIs:**
```typescript
// GET /api/events - List events with filtering
interface GetEventsParams {
  page?: number;
  limit?: number;
  category?: string;
  date_range?: 'today' | 'this_weekend' | 'next_week' | 'custom';
  start_date?: string;
  end_date?: string;
  location?: string;
  search?: string;
  is_paid?: boolean;
  featured?: boolean;
  organizer_id?: string;
}

interface EventListResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    categories: Array<{name: string, count: number}>;
    locations: Array<{name: string, count: number}>;
    priceRanges: Array<{range: string, count: number}>;
  };
}

// POST /api/events - Create new event
interface CreateEventRequest {
  title: string;
  description: string;
  short_description?: string;
  start_time: string; // ISO 8601
  end_time: string;
  timezone: string;
  location?: string;
  location_details?: string;
  latitude?: number;
  longitude?: number;
  is_online: boolean;
  online_url?: string;
  category: EventCategory;
  capacity?: number;
  is_paid: boolean;
  image?: File;
  tags?: string[];
  ticket_types?: TicketType[];
}
```

**RSVP and Ticketing APIs:**
```typescript
// POST /api/events/{eventId}/rsvp - Create RSVP
interface CreateRSVPRequest {
  guest_name?: string;
  guest_email?: string;
  notes?: string;
}

// POST /api/orders - Create order
interface CreateOrderRequest {
  event_id: string;
  items: Array<{
    ticket_type_id: string;
    quantity: number;
  }>;
  guest_info?: {
    name: string;
    email: string;
  };
  attendee_details?: Array<{
    name: string;
    email: string;
    ticket_type_id: string;
  }>;
}

// GET /api/orders/{orderId} - Order details
interface OrderResponse {
  id: string;
  event: EventSummary;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  tickets: Ticket[];
  payment_details: {
    payment_method: string;
    last_four?: string;
    receipt_url?: string;
  };
  qr_codes: Array<{
    ticket_id: string;
    qr_code_url: string;
    confirmation_code: string;
  }>;
}
```

#### Real-time Subscriptions
**Supabase Real-time Integration:**
```typescript
// Dashboard real-time updates
interface DashboardSubscription {
  table: 'rsvps' | 'orders' | 'events';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: 'public';
  filter?: string;
}

// Event capacity monitoring
const subscribeToEventUpdates = (eventId: string) => {
  return supabase
    .channel(`event-${eventId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'rsvps',
        filter: `event_id=eq.${eventId}`
      },
      handleRSVPUpdate
    )
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `event_id=eq.${eventId}`
      },
      handleOrderUpdate
    )
    .subscribe();
};
```

### Email & Communication System

#### Transactional Email Integration
**Resend/Mailgun Configuration:**
```typescript
interface EmailService {
  sendEventConfirmation(params: {
    to: string;
    eventDetails: Event;
    rsvpDetails?: RSVP;
    orderDetails?: Order;
    calendarAttachment: Buffer;
  }): Promise<void>;

  sendEventReminder(params: {
    to: string;
    eventDetails: Event;
    reminderType: '24_hours' | '2_hours' | '30_minutes';
  }): Promise<void>;

  sendEventUpdate(params: {
    to: string[];
    eventDetails: Event;
    updateType: 'cancelled' | 'rescheduled' | 'location_changed';
    message: string;
  }): Promise<void>;

  sendTicketDelivery(params: {
    to: string;
    orderDetails: Order;
    tickets: Ticket[];
    qrCodes: Array<{ticketId: string, qrCodeUrl: string}>;
  }): Promise<void>;
}
```

**Email Templates System:**
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  category: 'confirmation' | 'reminder' | 'update' | 'marketing';
}

// Calendar integration
interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  organizer: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
  }>;
}
```

### File Storage & Media Management

#### Supabase Storage Configuration
**Image Upload and Processing:**
```typescript
interface ImageUploadConfig {
  bucket: 'event-images';
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'];
  maxSize: 5 * 1024 * 1024; // 5MB
  dimensions: {
    thumbnail: { width: 300, height: 200 };
    card: { width: 600, height: 400 };
    hero: { width: 1200, height: 600 };
  };
  quality: 85;
  format: 'webp' | 'jpeg';
}

// Image processing pipeline
interface ImageProcessor {
  upload(file: File, eventId: string): Promise<string>;
  generateThumbnails(imageUrl: string): Promise<ImageVariants>;
  optimizeForWeb(imageUrl: string): Promise<string>;
  deleteEventImages(eventId: string): Promise<void>;
}

interface ImageVariants {
  original: string;
  thumbnail: string;
  card: string;
  hero: string;
}
```

### Testing Strategy & Implementation

#### End-to-End Testing with Playwright
**Comprehensive Test Coverage:**
```typescript
// Critical user journey tests
interface TestSuite {
  'Event Discovery': {
    'Browse events without account': () => Promise<void>;
    'Filter events by category': () => Promise<void>;
    'Search events by keyword': () => Promise<void>;
    'View event details': () => Promise<void>;
  };
  
  'RSVP Flow': {
    'RSVP as logged-in user': () => Promise<void>;
    'RSVP as guest user': () => Promise<void>;
    'Cancel RSVP': () => Promise<void>;
    'Add event to calendar': () => Promise<void>;
  };
  
  'Ticketing Flow': {
    'Purchase single ticket': () => Promise<void>;
    'Purchase multiple ticket types': () => Promise<void>;
    'Guest checkout flow': () => Promise<void>;
    'Payment failure handling': () => Promise<void>;
    'Ticket confirmation email': () => Promise<void>;
  };
  
  'Event Management': {
    'Create free event': () => Promise<void>;
    'Create paid event with tickets': () => Promise<void>;
    'Edit existing event': () => Promise<void>;
    'Monitor attendees dashboard': () => Promise<void>;
    'Process refund': () => Promise<void>;
  };
}
```

**Performance Testing Specifications:**
```typescript
interface PerformanceMetrics {
  pageLoadTime: {
    homepage: '<2s';
    eventDetails: '<1.5s';
    dashboard: '<3s';
  };
  
  apiResponseTime: {
    eventsList: '<500ms';
    rsvpCreation: '<300ms';
    orderCreation: '<1s';
  };
  
  concurrentUsers: {
    target: 20;
    peak: 50;
    breakpoint: 100;
  };
  
  mobilePerformance: {
    firstContentfulPaint: '<1.5s';
    largestContentfulPaint: '<2.5s';
    cumulativeLayoutShift: '<0.1';
  };
}
```

### Deployment & Infrastructure

#### Vercel Deployment Configuration
**Production Environment Setup:**
```typescript
// vercel.json configuration
interface VercelConfig {
  version: 2;
  builds: [
    { src: 'package.json', use: '@vercel/next' }
  ];
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    EMAIL_API_KEY: string;
    MAPBOX_ACCESS_TOKEN: string;
  };
  functions: {
    'app/api/webhooks/stripe.ts': {
      maxDuration: 30;
    };
    'app/api/orders/create.ts': {
      maxDuration: 20;
    };
  };
}
```

**CI/CD Pipeline with GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npx playwright test
        env:
          PLAYWRIGHT_BROWSERS_PATH: 0
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Monitoring & Error Tracking

#### Comprehensive Monitoring Setup
**Application Performance Monitoring:**
```typescript
interface MonitoringConfig {
  errorTracking: {
    service: 'Sentry';
    dsn: string;
    environment: 'development' | 'staging' | 'production';
    sampleRate: 1.0;
    tracesSampleRate: 0.1;
  };
  
  performanceMonitoring: {
    service: 'Vercel Analytics';
    webVitals: true;
    customMetrics: [
      'rsvp_completion_time',
      'checkout_completion_time',
      'event_creation_time'
    ];
  };
  
  logManagement: {
    service: 'Vercel Logs';
    retention: '30 days';
    alertThresholds: {
      errorRate: '> 1%';
      responseTime: '> 2s';
      webhookFailures: '> 5';
    };
  };
}
```

### Security Implementation

#### Comprehensive Security Measures
**Application Security Framework:**
```typescript
interface SecurityConfig {
  authentication: {
    passwordRequirements: {
      minLength: 8;
      requireUppercase: true;
      requireLowercase: true;
      requireNumbers: true;
      requireSpecialChars: true;
    };
    sessionTimeout: '7 days';
    maxConcurrentSessions: 5;
  };
  
  apiSecurity: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000; // 15 minutes
      maxRequests: 100;
      skipSuccessfulRequests: false;
    };
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
      credentials: true;
    };
    helmet: {
      contentSecurityPolicy: true;
      crossOriginEmbedderPolicy: false;
    };
  };
  
  dataProtection: {
    encryption: {
      algorithm: 'aes-256-gcm';
      keyRotation: '90 days';
    };
    backup: {
      frequency: 'daily';
      retention: '30 days';
      encryption: true;
    };
    gdprCompliance: {
      dataRetention: '2 years';
      rightToErasure: true;
      dataPortability: true;
    };
  };
}
```

### Scalability & Performance Architecture

#### Performance Optimization Strategy
**Caching and Optimization:**
```typescript
interface CachingStrategy {
  clientSide: {
    queryCache: {
      staleTime: 5 * 60 * 1000; // 5 minutes
      cacheTime: 10 * 60 * 1000; // 10 minutes
    };
    imageCache: {
      maxAge: '31536000'; // 1 year
      immutable: true;
    };
  };
  
  serverSide: {
    isr: {
      revalidate: 300; // 5 minutes
      fallback: 'blocking';
    };
    apiCache: {
      ttl: 60; // 1 minute
      maxSize: 100;
    };
  };
  
  database: {
    connectionPooling: {
      max: 20;
      min: 5;
      idle: 10000;
    };
    queryOptimization: {
      indexUsage: 'monitor';
      slowQueryThreshold: '1s';
    };
  };
}
```

This comprehensive technical context provides the AI with detailed information about every aspect of the LocalLoop platform's technical implementation, from database schemas to deployment strategies, ensuring informed development decisions throughout the project.