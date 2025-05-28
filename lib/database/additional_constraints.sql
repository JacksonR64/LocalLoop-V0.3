-- Additional Constraints and Indexes for LocalLoop Database
-- Supplements the main schema with business logic constraints and performance optimizations
-- Google Calendar API Integration Support

-- Additional Check Constraints for Business Logic

-- Events: Ensure end_time is after start_time
ALTER TABLE events 
ADD CONSTRAINT check_event_time_logical 
CHECK (end_time > start_time);

-- Events: Ensure capacity is positive if set
ALTER TABLE events 
ADD CONSTRAINT check_event_capacity_positive 
CHECK (capacity IS NULL OR capacity > 0);

-- Events: Ensure online events have online_url when is_online is true
ALTER TABLE events 
ADD CONSTRAINT check_online_event_url 
CHECK (NOT is_online OR online_url IS NOT NULL);

-- Events: Ensure offline events have location when is_online is false
ALTER TABLE events 
ADD CONSTRAINT check_offline_event_location 
CHECK (is_online OR location IS NOT NULL);

-- Events: Ensure paid events are not set as both paid and free
-- (This is implicit but adding for clarity)
ALTER TABLE events 
ADD CONSTRAINT check_event_payment_status 
CHECK (is_paid IS NOT NULL);

-- Ticket Types: Ensure price is non-negative
ALTER TABLE ticket_types 
ADD CONSTRAINT check_ticket_price_non_negative 
CHECK (price >= 0);

-- Ticket Types: Ensure capacity is positive if set
ALTER TABLE ticket_types 
ADD CONSTRAINT check_ticket_capacity_positive 
CHECK (capacity IS NULL OR capacity > 0);

-- Ticket Types: Ensure sort_order is non-negative
ALTER TABLE ticket_types 
ADD CONSTRAINT check_ticket_sort_order_non_negative 
CHECK (sort_order >= 0);

-- Ticket Types: Ensure sale_end is after sale_start if both are set
ALTER TABLE ticket_types 
ADD CONSTRAINT check_ticket_sale_time_logical 
CHECK (sale_start IS NULL OR sale_end IS NULL OR sale_end > sale_start);

-- Orders: Ensure total_amount is positive
ALTER TABLE orders 
ADD CONSTRAINT check_order_total_positive 
CHECK (total_amount > 0);

-- Orders: Ensure refund_amount is non-negative and not greater than total
ALTER TABLE orders 
ADD CONSTRAINT check_refund_amount_logical 
CHECK (refund_amount >= 0 AND refund_amount <= total_amount);

-- Tickets: Ensure quantity is positive
ALTER TABLE tickets 
ADD CONSTRAINT check_ticket_quantity_positive 
CHECK (quantity > 0);

-- Tickets: Ensure unit_price is non-negative
ALTER TABLE tickets 
ADD CONSTRAINT check_ticket_unit_price_non_negative 
CHECK (unit_price >= 0);

-- Google Calendar Integration Constraints

-- Events: Ensure Google Calendar template is valid JSON
ALTER TABLE events 
ADD CONSTRAINT check_google_calendar_template_json 
CHECK (google_calendar_event_template IS NOT NULL);

-- Users: Ensure Google Calendar tokens are consistent
-- If connected, should have access_token; if has tokens, should have expiry
ALTER TABLE users 
ADD CONSTRAINT check_google_calendar_tokens_consistent 
CHECK (
  (NOT google_calendar_connected OR google_calendar_access_token IS NOT NULL) AND
  (google_calendar_access_token IS NULL OR google_calendar_token_expires_at IS NOT NULL)
);

-- RSVPs: Ensure Google Calendar event ID is present if marked as added
ALTER TABLE rsvps 
ADD CONSTRAINT check_rsvp_calendar_consistency 
CHECK (NOT added_to_google_calendar OR google_calendar_event_id IS NOT NULL);

-- Orders: Ensure Google Calendar event ID is present if marked as added
ALTER TABLE orders 
ADD CONSTRAINT check_order_calendar_consistency 
CHECK (NOT added_to_google_calendar OR google_calendar_event_id IS NOT NULL);

-- Additional Performance Indexes

-- Composite indexes for complex queries

-- Events: Most common filtering combinations
CREATE INDEX idx_events_category_start_time ON events(category, start_time) 
WHERE published = true AND cancelled = false;

CREATE INDEX idx_events_location_start_time ON events(location, start_time) 
WHERE published = true AND cancelled = false;

CREATE INDEX idx_events_paid_category_start ON events(is_paid, category, start_time) 
WHERE published = true AND cancelled = false;

-- Events: Organizer dashboard queries
CREATE INDEX idx_events_organizer_status ON events(organizer_id, status) 
WHERE published = true;

-- RSVPs: Event management queries  
CREATE INDEX idx_rsvps_event_created ON rsvps(event_id, created_at);

-- RSVPs: User profile queries
CREATE INDEX idx_rsvps_user_event_time ON rsvps(user_id, event_id) 
WHERE status = 'confirmed';

-- Orders: Financial reporting
CREATE INDEX idx_orders_event_status_created ON orders(event_id, status, created_at);

CREATE INDEX idx_orders_created_amount ON orders(created_at, total_amount) 
WHERE status = 'completed';

-- Google Calendar Integration Performance Indexes

-- Failed calendar integrations for retry processing
CREATE INDEX idx_rsvps_calendar_failed ON rsvps(calendar_add_attempted_at) 
WHERE added_to_google_calendar = false AND calendar_add_error IS NOT NULL;

CREATE INDEX idx_orders_calendar_failed ON orders(calendar_add_attempted_at) 
WHERE added_to_google_calendar = false AND calendar_add_error IS NOT NULL;

-- Calendar integration success tracking
CREATE INDEX idx_rsvps_calendar_success ON rsvps(calendar_add_attempted_at) 
WHERE added_to_google_calendar = true;

CREATE INDEX idx_orders_calendar_success ON orders(calendar_add_attempted_at) 
WHERE added_to_google_calendar = true;

-- User calendar connection status
CREATE INDEX idx_users_calendar_error ON users(google_calendar_connected, google_calendar_error) 
WHERE google_calendar_error IS NOT NULL;

-- Analytics and Reporting Indexes

-- Event popularity and engagement
CREATE INDEX idx_events_view_count ON events(view_count DESC) 
WHERE published = true;

-- Time-based analytics
CREATE INDEX idx_events_created_month ON events(date_trunc('month', created_at));
CREATE INDEX idx_rsvps_created_month ON rsvps(date_trunc('month', created_at));
CREATE INDEX idx_orders_created_month ON orders(date_trunc('month', created_at));

-- Capacity and availability tracking
CREATE INDEX idx_events_capacity_tracking ON events(capacity, start_time) 
WHERE capacity IS NOT NULL AND published = true;

-- Guest user tracking (for conversion analysis)
CREATE INDEX idx_rsvps_guest_tracking ON rsvps(guest_email, created_at) 
WHERE guest_email IS NOT NULL;

CREATE INDEX idx_orders_guest_tracking ON orders(guest_email, created_at) 
WHERE guest_email IS NOT NULL;

-- Advanced Constraints Documentation

COMMENT ON CONSTRAINT check_event_time_logical ON events IS 
'Ensures event end time is after start time for logical consistency';

COMMENT ON CONSTRAINT check_online_event_url ON events IS 
'Ensures online events have a valid URL for attendees';

COMMENT ON CONSTRAINT check_google_calendar_tokens_consistent ON users IS 
'Ensures Google Calendar OAuth token fields are in a consistent state';

COMMENT ON CONSTRAINT check_rsvp_calendar_consistency ON rsvps IS 
'Ensures RSVPs marked as added to calendar actually have a Google Calendar event ID';

-- Index Documentation for Performance Monitoring

COMMENT ON INDEX idx_events_category_start_time IS 
'Optimizes event listing by category and date - most common user query pattern';

COMMENT ON INDEX idx_rsvps_calendar_failed IS 
'Enables efficient retry processing for failed Google Calendar integrations';

COMMENT ON INDEX idx_orders_calendar_success IS 
'Supports analytics on successful Google Calendar integration rates'; 