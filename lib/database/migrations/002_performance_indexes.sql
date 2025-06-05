-- Performance Optimization Indexes Migration
-- Additional strategic indexes for LocalLoop V0.3 performance optimization

-- 1. Composite index for event status filtering with time ordering
-- Optimizes queries that filter by computed status and order by time
CREATE INDEX IF NOT EXISTS idx_events_status_time 
ON events(start_time, end_time, cancelled, published) 
WHERE published = true;

-- 2. Composite index for admin dashboard event management
-- Optimizes organizer-specific event queries with status filtering
CREATE INDEX IF NOT EXISTS idx_events_organizer_status 
ON events(organizer_id, published, cancelled, start_time) 
WHERE published = true OR cancelled = true;

-- 3. Optimize RSVP counting for events
-- Partial index for confirmed RSVPs to speed up count queries
CREATE INDEX IF NOT EXISTS idx_rsvps_confirmed_count 
ON rsvps(event_id) 
WHERE status = 'confirmed';

-- 4. Optimize ticket queries by order and type
-- Simple index for ticket lookups without subquery
CREATE INDEX IF NOT EXISTS idx_tickets_order_type 
ON tickets(order_id, ticket_type_id);

-- 5. User authentication and role queries optimization
-- Composite index for user lookup with role filtering
CREATE INDEX IF NOT EXISTS idx_users_email_role 
ON users(email, role, email_verified) 
WHERE deleted_at IS NULL;

-- 6. Event search optimization with category filtering
-- Composite index for filtered search results
CREATE INDEX IF NOT EXISTS idx_events_category_time 
ON events(category, start_time, featured) 
WHERE published = true AND cancelled = false;

-- 7. Google Calendar integration optimization
-- Index for users with calendar integration for batch operations
CREATE INDEX IF NOT EXISTS idx_users_calendar_tokens 
ON users(google_calendar_connected, google_calendar_token_expires_at) 
WHERE google_calendar_connected = true AND google_calendar_access_token IS NOT NULL;

-- 8. Event capacity and availability optimization
-- Index for events with capacity limits for availability checks
CREATE INDEX IF NOT EXISTS idx_events_capacity_check 
ON events(id, capacity, start_time) 
WHERE capacity IS NOT NULL AND published = true AND cancelled = false;

-- 9. Order processing optimization
-- Composite index for Stripe webhook processing
CREATE INDEX IF NOT EXISTS idx_orders_stripe_processing 
ON orders(stripe_payment_intent_id, status, created_at) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- 10. Event analytics optimization
-- Index for view count and analytics queries
CREATE INDEX IF NOT EXISTS idx_events_analytics 
ON events(view_count, created_at, category) 
WHERE published = true;

-- Add comments for documentation
COMMENT ON INDEX idx_events_status_time IS 'Optimizes event listing queries with status filtering and time ordering';
COMMENT ON INDEX idx_events_organizer_status IS 'Optimizes organizer dashboard queries for event management';
COMMENT ON INDEX idx_rsvps_confirmed_count IS 'Speeds up RSVP count calculations for event capacity checks';
COMMENT ON INDEX idx_tickets_order_type IS 'Optimizes ticket lookups and revenue calculations';
COMMENT ON INDEX idx_users_email_role IS 'Optimizes user authentication and role-based access queries';
COMMENT ON INDEX idx_events_category_time IS 'Optimizes filtered event search with category and time constraints';
COMMENT ON INDEX idx_users_calendar_tokens IS 'Optimizes Google Calendar integration batch operations';
COMMENT ON INDEX idx_events_capacity_check IS 'Speeds up event availability and capacity validation';
COMMENT ON INDEX idx_orders_stripe_processing IS 'Optimizes Stripe webhook processing and order status updates';
COMMENT ON INDEX idx_events_analytics IS 'Optimizes event analytics and reporting queries'; 