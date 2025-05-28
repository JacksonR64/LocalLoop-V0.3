# LocalLoop Database Deployment Guide

This guide covers deploying the LocalLoop database schema to Supabase, including all tables, constraints, computed columns, indexes, and Row-Level Security policies.

## 🎯 Overview

The LocalLoop database schema includes:
- **6 core tables**: users, events, rsvps, orders, tickets, ticket_types
- **Google Calendar API integration**: OAuth token storage, event templates, integration tracking
- **31 strategic indexes**: Performance optimization for search, filtering, and Google Calendar operations
- **35+ constraints**: Business logic enforcement and data integrity
- **21 computed columns**: Real-time calculations for dashboards and analytics
- **Comprehensive RLS policies**: Multi-tenant security with role-based access

## 🚀 Quick Deployment (Recommended)

### Option 1: Single Script Deployment

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com) 
   - Open your project
   - Navigate to SQL Editor

2. **Execute Deployment Script**
   ```sql
   -- Copy and paste the entire contents of scripts/deploy-to-supabase.sql
   -- into the Supabase SQL Editor and run it
   ```

3. **Verify Deployment**
   - Check that all tables are created in the Table Editor
   - Verify RLS policies are enabled
   - Test basic operations

### Option 2: Supabase CLI Deployment

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Initialize local project (if not done)
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the schema
supabase db push

# Or apply migration directly
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/deploy-to-supabase.sql
```

## 📋 Manual Step-by-Step Deployment

If you prefer to deploy in stages or need to troubleshoot:

### Step 1: Enable Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Step 2: Create Helper Functions
```sql
-- Copy from scripts/deploy-to-supabase.sql
-- STEP 2: HELPER FUNCTIONS section
```

### Step 3: Create Tables
```sql
-- Copy from scripts/deploy-to-supabase.sql
-- STEP 3: CREATE TABLES section
```

### Step 4: Add Computed Columns
```sql
-- Copy from scripts/deploy-to-supabase.sql
-- STEP 4: CREATE COMPUTED COLUMNS section
```

### Step 5: Create Indexes
```sql
-- Copy from scripts/deploy-to-supabase.sql
-- STEP 5: CREATE INDEXES section
```

### Step 6: Set Up Triggers
```sql
-- Copy from scripts/deploy-to-supabase.sql
-- STEP 6: CREATE TRIGGERS section
```

### Step 7: Enable RLS and Create Policies
```sql
-- Copy from scripts/deploy-to-supabase.sql
-- STEP 7-9: RLS sections
```

## 🔧 Configuration After Deployment

### 1. Environment Variables

Add these to your Next.js application's `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Calendar API (CLIENT REQUIREMENT)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Stripe (for paid events)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 2. Google Calendar API Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google Calendar API**
   - Navigate to APIs & Services > Library
   - Search for "Google Calendar API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://your-domain.com/api/auth/google/callback` (production)

4. **Configure OAuth Consent Screen**
   - Add necessary scopes: `https://www.googleapis.com/auth/calendar`
   - Add test users during development

### 3. Stripe Setup (for paid events)

1. **Create Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Complete account verification

2. **Get API Keys**
   - Navigate to Developers > API Keys
   - Copy Publishable Key and Secret Key

3. **Configure Webhooks**
   - Add webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## ✅ Testing the Schema

Run the comprehensive test suite:

```bash
# Test schema files for syntax and consistency
node scripts/test-schema.js

# Validate SQL syntax
node scripts/validate-sql.js
```

Expected output:
```
✅ All 25+ tests passed! 🎉
Database schema is ready for deployment.
```

## 🔍 Verification Checklist

After deployment, verify these components:

### Tables and Structure
- [ ] All 6 tables created (users, events, rsvps, orders, tickets, ticket_types)
- [ ] All columns present with correct data types
- [ ] Primary keys and foreign keys properly configured
- [ ] Google Calendar integration fields present

### Indexes and Performance
- [ ] 31 indexes created successfully
- [ ] Full-text search index on events working
- [ ] Google Calendar integration indexes present
- [ ] Query performance optimized for expected workloads

### Security (RLS)
- [ ] Row-Level Security enabled on all tables
- [ ] User can only see their own data
- [ ] Event organizers can manage their events
- [ ] Guest users (email-based) access working
- [ ] Admin users have appropriate access

### Business Logic
- [ ] Constraints prevent invalid data states
- [ ] Time validation working (start < end time)
- [ ] Capacity checks functioning
- [ ] Google Calendar token consistency enforced

### Computed Columns
- [ ] Event status calculated correctly
- [ ] RSVP counts accurate
- [ ] Calendar integration status working
- [ ] Dashboard analytics functioning

## 🐛 Troubleshooting

### Common Issues

**1. Extension Errors**
```sql
-- If uuid-ossp extension fails
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
```

**2. RLS Policy Errors**
```sql
-- Check if policies already exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'events', 'rsvps', 'orders', 'tickets', 'ticket_types');
```

**3. Index Creation Failures**
```sql
-- Check existing indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('users', 'events', 'rsvps', 'orders', 'tickets', 'ticket_types');
```

**4. Function Errors**
```sql
-- Verify auth schema functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'auth';
```

### Performance Monitoring

Monitor these key metrics after deployment:

```sql
-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename IN ('events', 'rsvps', 'orders');

-- Monitor query performance
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE query ILIKE '%events%'
ORDER BY mean_time DESC;
```

## 📚 Next Steps

After successful deployment:

1. **Test Google Calendar Integration**
   - Implement OAuth flow in application
   - Test event creation and calendar syncing
   - Verify retry logic for failed calendar operations

2. **Implement Application Layer**
   - Create Supabase client configuration
   - Build API routes for CRUD operations
   - Add error handling and validation

3. **Set Up Monitoring**
   - Enable Supabase database insights
   - Configure alerts for critical metrics
   - Set up logging for Google Calendar API calls

4. **Security Review**
   - Test RLS policies with different user roles
   - Validate data access patterns
   - Review and audit permissions

## 🎉 Success!

If all verification steps pass, your LocalLoop database schema is successfully deployed and ready for application development with full Google Calendar API integration support!

---

*For additional support, refer to the [Supabase Documentation](https://supabase.com/docs) and [Google Calendar API Documentation](https://developers.google.com/calendar).* 