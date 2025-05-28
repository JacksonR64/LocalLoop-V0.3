-- Migration: 001_initial_schema.sql
-- Description: Initial LocalLoop database schema with Google Calendar integration
-- Created: 2025-01-01
-- Google Calendar API Integration Support (PRIMARY CLIENT REQUIREMENT)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for generating confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code() 
RETURNS text AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Users table with Google Calendar OAuth integration
CREATE TABLE users (
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
CREATE TABLE events (
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

-- Add computed columns for events
ALTER TABLE events ADD COLUMN status text GENERATED ALWAYS AS (
  CASE 
    WHEN cancelled THEN 'cancelled'
    WHEN start_time > now() THEN 'upcoming'
    WHEN start_time <= now() AND end_time >= now() THEN 'in_progress'
    ELSE 'past'
  END
) STORED;

-- RSVPs table with Google Calendar integration tracking
CREATE TABLE rsvps (
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
CREATE TABLE ticket_types (
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
CREATE TABLE orders (
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
CREATE TABLE tickets (
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

-- Indexes for performance optimization

-- Event discovery and filtering
CREATE INDEX idx_events_start_time ON events(start_time) WHERE published = true AND cancelled = false;
CREATE INDEX idx_events_category ON events(category) WHERE published = true;
CREATE INDEX idx_events_location ON events(location) WHERE published = true;
CREATE INDEX idx_events_featured ON events(featured, start_time) WHERE published = true;
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- Full-text search for events
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

-- RSVP and capacity tracking
CREATE INDEX idx_rsvps_event_status ON rsvps(event_id, status);
CREATE INDEX idx_rsvps_user ON rsvps(user_id) WHERE status = 'confirmed';
CREATE INDEX idx_rsvps_guest_email ON rsvps(guest_email) WHERE guest_email IS NOT NULL;

-- Google Calendar integration tracking (CLIENT REQUIREMENT)
CREATE INDEX idx_rsvps_calendar_integration ON rsvps(added_to_google_calendar, calendar_add_attempted_at);
CREATE INDEX idx_orders_calendar_integration ON orders(added_to_google_calendar, calendar_add_attempted_at);

-- Ticketing and orders
CREATE INDEX idx_orders_user ON orders(user_id) WHERE status = 'completed';
CREATE INDEX idx_orders_event ON orders(event_id, status);
CREATE INDEX idx_orders_guest_email ON orders(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX idx_tickets_confirmation ON tickets(confirmation_code);
CREATE INDEX idx_tickets_order ON tickets(order_id);

-- User management
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_google_calendar ON users(google_calendar_connected) WHERE google_calendar_connected = true;

-- Ticket types
CREATE INDEX idx_ticket_types_event ON ticket_types(event_id, sort_order);

-- Updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with Google Calendar OAuth integration support';
COMMENT ON TABLE events IS 'Community events with Google Calendar integration template data';
COMMENT ON TABLE rsvps IS 'Free event RSVPs with Google Calendar tracking';
COMMENT ON TABLE orders IS 'Paid event orders with Google Calendar tracking';
COMMENT ON TABLE tickets IS 'Individual tickets within orders';
COMMENT ON TABLE ticket_types IS 'Ticket pricing and availability for paid events';

COMMENT ON COLUMN users.google_calendar_access_token IS 'Encrypted Google OAuth access token for Calendar API';
COMMENT ON COLUMN users.google_calendar_refresh_token IS 'Encrypted Google OAuth refresh token for Calendar API';
COMMENT ON COLUMN events.google_calendar_event_template IS 'Template data for consistent Google Calendar event creation';
COMMENT ON COLUMN rsvps.google_calendar_event_id IS 'Google Calendar event ID for deletion if RSVP cancelled';
COMMENT ON COLUMN orders.google_calendar_event_id IS 'Google Calendar event ID for deletion if order cancelled'; 