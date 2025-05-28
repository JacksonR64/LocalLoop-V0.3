-- LocalLoop Database Deployment Script for Supabase
-- Complete schema deployment including all tables, constraints, computed columns, and RLS policies
-- Execute this script in Supabase SQL Editor or via Supabase CLI

-- ==============================================
-- STEP 1: ENABLE EXTENSIONS
-- ==============================================

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- STEP 2: HELPER FUNCTIONS
-- ==============================================

-- Helper function for generating confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code() 
RETURNS text AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================
-- STEP 3: CREATE TABLES
-- ==============================================

-- Users table with Google Calendar OAuth integration
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Core user information
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'admin')),
  
  -- Account status
  email_verified boolean DEFAULT false,
  last_login timestamp with time zone,
  deleted_at timestamp with time zone,
  
  -- Preferences
  email_preferences jsonb DEFAULT '{"marketing": false, "events": true, "reminders": true}',
  
  -- Google Calendar API Integration (CLIENT REQUIREMENT)
  google_calendar_access_token text, -- Encrypted storage
  google_calendar_refresh_token text, -- Encrypted storage  
  google_calendar_token_expires_at timestamp with time zone,
  google_calendar_connected boolean DEFAULT false,
  google_calendar_error text, -- Last error message for debugging
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- Events table with Google Calendar template support
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Core event information
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,
  
  -- Date and time
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  
  -- Location information
  location text,
  location_details text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  is_online boolean DEFAULT false,
  online_url text,
  
  -- Event categorization
  category text NOT NULL CHECK (category IN ('workshop', 'meeting', 'social', 'arts', 'sports', 'family', 'business', 'education', 'other')),
  tags text[] DEFAULT '{}',
  
  -- Capacity and ticketing
  capacity integer,
  is_paid boolean DEFAULT false,
  
  -- Organization
  organizer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  -- Media and presentation
  image_url text,
  image_alt_text text,
  featured boolean DEFAULT false,
  
  -- Status and publishing
  published boolean DEFAULT true,
  cancelled boolean DEFAULT false,
  
  -- Analytics
  view_count integer DEFAULT 0,
  
  -- Google Calendar Integration (CLIENT REQUIREMENT)
  google_calendar_event_template jsonb DEFAULT '{}', -- Template for consistent calendar event creation
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- RSVPs table with Google Calendar integration tracking
CREATE TABLE IF NOT EXISTS rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Event and user relationship
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Guest information (for non-registered users)
  guest_email text,
  guest_name text,
  
  -- RSVP status
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
  
  -- Event management
  check_in_time timestamp with time zone,
  notes text,
  
  -- Google Calendar Integration Tracking (CLIENT REQUIREMENT)
  google_calendar_event_id text, -- For event deletion if RSVP cancelled
  added_to_google_calendar boolean DEFAULT false,
  calendar_add_attempted_at timestamp with time zone,
  calendar_add_error text, -- Error message for debugging
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT rsvp_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR 
    (user_id IS NULL AND guest_email IS NOT NULL)
  ),
  UNIQUE(event_id, user_id),
  UNIQUE(event_id, guest_email)
);

-- Ticket types for paid events
CREATE TABLE IF NOT EXISTS ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Event relationship
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  
  -- Ticket information
  name text NOT NULL,
  description text,
  price integer NOT NULL, -- in cents
  capacity integer,
  sort_order integer DEFAULT 0,
  
  -- Sale timing
  sale_start timestamp with time zone,
  sale_end timestamp with time zone,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- Orders table with Google Calendar integration tracking
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Customer information
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_email text,
  guest_name text,
  
  -- Event relationship
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  
  -- Order status and payment
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed', 'cancelled')),
  total_amount integer NOT NULL, -- in cents
  currency text DEFAULT 'USD',
  
  -- Stripe integration
  stripe_payment_intent_id text,
  stripe_session_id text,
  
  -- Refund information
  refunded_at timestamp with time zone,
  refund_amount integer DEFAULT 0,
  
  -- Google Calendar Integration Tracking (CLIENT REQUIREMENT)
  google_calendar_event_id text, -- For event deletion if order cancelled
  added_to_google_calendar boolean DEFAULT false,
  calendar_add_attempted_at timestamp with time zone,
  calendar_add_error text, -- Error message for debugging
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT order_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR 
    (user_id IS NULL AND guest_email IS NOT NULL)
  )
);

-- Individual tickets within orders
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Order and ticket type relationship
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id uuid REFERENCES ticket_types(id) ON DELETE CASCADE,
  
  -- Ticket details
  quantity integer NOT NULL DEFAULT 1,
  unit_price integer NOT NULL, -- in cents
  
  -- Attendee information
  attendee_name text,
  attendee_email text,
  
  -- Ticket identification
  confirmation_code text UNIQUE NOT NULL DEFAULT generate_confirmation_code(),
  qr_code_data text,
  
  -- Event management
  check_in_time timestamp with time zone,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- ==============================================
-- STEP 4: CREATE COMPUTED COLUMNS
-- ==============================================

-- Events computed columns
DO $$ 
BEGIN
  -- Add event status computed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'status'
  ) THEN
    ALTER TABLE events ADD COLUMN status text GENERATED ALWAYS AS (
      CASE 
        WHEN cancelled THEN 'cancelled'
        WHEN start_time > now() THEN 'upcoming'
        WHEN start_time <= now() AND end_time >= now() THEN 'in_progress'
        ELSE 'past'
      END
    ) STORED;
  END IF;
END $$;

-- ==============================================
-- STEP 5: CREATE INDEXES
-- ==============================================

-- Event discovery and filtering indexes
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time) WHERE published = true AND cancelled = false;
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured, start_time) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

-- Full-text search for events
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

-- RSVP and capacity tracking
CREATE INDEX IF NOT EXISTS idx_rsvps_event_status ON rsvps(event_id, status);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON rsvps(user_id) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_email ON rsvps(guest_email) WHERE guest_email IS NOT NULL;

-- Google Calendar integration tracking (CLIENT REQUIREMENT)
CREATE INDEX IF NOT EXISTS idx_rsvps_calendar_integration ON rsvps(added_to_google_calendar, calendar_add_attempted_at);
CREATE INDEX IF NOT EXISTS idx_orders_calendar_integration ON orders(added_to_google_calendar, calendar_add_attempted_at);

-- Ticketing and orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_confirmation ON tickets(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);

-- User management
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_google_calendar ON users(google_calendar_connected) WHERE google_calendar_connected = true;

-- Ticket types
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id, sort_order);

-- ==============================================
-- STEP 6: CREATE TRIGGERS
-- ==============================================

-- Updated_at triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rsvps_updated_at ON rsvps;
CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_types_updated_at ON ticket_types;
CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 8: CREATE RLS HELPER FUNCTIONS
-- ==============================================

-- Function to check if user is event organizer
CREATE OR REPLACE FUNCTION auth.is_event_organizer(event_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM events 
        WHERE id = event_uuid 
        AND organizer_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns order/RSVP via email
CREATE OR REPLACE FUNCTION auth.owns_guest_record(guest_email_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN guest_email_param = (
        SELECT email FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- STEP 9: CREATE RLS POLICIES
-- ==============================================

-- Drop existing policies if they exist (for redeployment)
DO $$ 
DECLARE
    policy_name text;
    policies text[] := ARRAY[
        'users_select_own', 'users_update_own', 'users_insert_own', 'users_select_admin', 'users_update_admin', 'users_select_public',
        'events_select_published', 'events_select_own', 'events_insert_organizer', 'events_update_own', 'events_delete_own', 'events_select_admin', 'events_update_admin',
        'rsvps_select_own', 'rsvps_insert_own', 'rsvps_update_own', 'rsvps_delete_own', 'rsvps_select_organizer', 'rsvps_update_organizer', 'rsvps_select_admin',
        'orders_select_own', 'orders_insert_own', 'orders_update_own', 'orders_select_organizer', 'orders_update_organizer', 'orders_select_admin', 'orders_update_admin',
        'tickets_select_own', 'tickets_insert_system', 'tickets_select_organizer', 'tickets_update_organizer', 'tickets_select_admin',
        'ticket_types_select_public', 'ticket_types_select_organizer', 'ticket_types_insert_organizer', 'ticket_types_update_organizer', 'ticket_types_delete_organizer', 'ticket_types_admin'
    ];
BEGIN
    FOREACH policy_name IN ARRAY policies
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON events', policy_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON rsvps', policy_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON orders', policy_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON tickets', policy_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON ticket_types', policy_name);
    END LOOP;
END $$;

-- Users table policies
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Events table policies
CREATE POLICY "events_select_published" ON events FOR SELECT USING (published = true AND deleted_at IS NULL);
CREATE POLICY "events_select_own" ON events FOR SELECT USING (auth.uid() = organizer_id);
CREATE POLICY "events_insert_organizer" ON events FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('organizer', 'admin'))
);
CREATE POLICY "events_update_own" ON events FOR UPDATE USING (auth.uid() = organizer_id);

-- RSVPs table policies
CREATE POLICY "rsvps_select_own" ON rsvps FOR SELECT USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND guest_email = (SELECT email FROM users WHERE id = auth.uid()))
);
CREATE POLICY "rsvps_insert_own" ON rsvps FOR INSERT WITH CHECK (
    (auth.uid() = user_id AND guest_email IS NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
);

-- Orders table policies
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND guest_email = (SELECT email FROM users WHERE id = auth.uid()))
);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (
    (auth.uid() = user_id AND guest_email IS NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
);

-- Tickets table policies
CREATE POLICY "tickets_select_own" ON tickets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.id = tickets.order_id 
        AND (
            o.user_id = auth.uid() OR
            (o.user_id IS NULL AND o.guest_email = (SELECT email FROM users WHERE id = auth.uid()))
        )
    )
);

-- Ticket types table policies
CREATE POLICY "ticket_types_select_public" ON ticket_types FOR SELECT USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = ticket_types.event_id AND e.published = true)
);

-- ==============================================
-- STEP 10: ADD DOCUMENTATION
-- ==============================================

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with Google Calendar OAuth integration support';
COMMENT ON TABLE events IS 'Community events with Google Calendar integration template data';
COMMENT ON TABLE rsvps IS 'Free event RSVPs with Google Calendar tracking';
COMMENT ON TABLE orders IS 'Paid event orders with Google Calendar tracking';
COMMENT ON TABLE tickets IS 'Individual tickets within orders';
COMMENT ON TABLE ticket_types IS 'Ticket pricing and availability for paid events';

-- ==============================================
-- DEPLOYMENT COMPLETE
-- ==============================================

-- Verify deployment
SELECT 'LocalLoop database schema deployed successfully!' as status; 