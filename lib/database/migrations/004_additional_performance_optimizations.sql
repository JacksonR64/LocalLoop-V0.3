-- Additional performance optimizations based on load testing results
-- Migration: 004_additional_performance_optimizations.sql

-- Add partial indexes for common filtering scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status_date_public
ON events (status, date_time, is_public)
WHERE status = 'active' AND is_public = true;

-- Optimize event lookup with location filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location_gin
ON events USING GIN (to_tsvector('english', location))
WHERE status = 'active';

-- Optimize search functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_search_vector
ON events USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(location, '')
  )
)
WHERE status = 'active';

-- Add covering index for event listings with all required data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_listing_covering
ON events (date_time DESC, id)
INCLUDE (title, location, max_attendees, is_paid, status, image_url)
WHERE status = 'active' AND is_public = true;

-- Optimize RSVP counting with materialized approach
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_event_count_active
ON rsvps (event_id)
WHERE status = 'confirmed';

-- Add compound index for user event history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rsvps_user_history
ON rsvps (user_id, created_at DESC)
INCLUDE (event_id, status);

-- Optimize ticket type queries for checkout flow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ticket_types_event_available
ON ticket_types (event_id, is_available)
WHERE is_available = true;

-- Add index for order lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status_date
ON orders (user_id, status, created_at DESC)
WHERE status IN ('completed', 'processing');

-- Optimize Google Calendar token lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_tokens
ON users (id)
WHERE google_access_token IS NOT NULL;

-- Add statistics to improve query planning
ANALYZE events;
ANALYZE rsvps;
ANALYZE ticket_types;
ANALYZE orders;
ANALYZE users;

-- Update table statistics for better query planning
ALTER TABLE events SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE rsvps SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE orders SET (autovacuum_analyze_scale_factor = 0.05);

-- Add comments for documentation
COMMENT ON INDEX idx_events_status_date_public IS 'Optimizes public event listings by status and date';
COMMENT ON INDEX idx_events_location_gin IS 'Enables fast location-based searches';
COMMENT ON INDEX idx_events_search_vector IS 'Optimizes full-text search across event fields';
COMMENT ON INDEX idx_events_listing_covering IS 'Covering index for event listing pages with all required columns';
COMMENT ON INDEX idx_rsvps_event_count_active IS 'Fast RSVP counting for capacity checks';
COMMENT ON INDEX idx_rsvps_user_history IS 'Optimizes user event history queries';
COMMENT ON INDEX idx_ticket_types_event_available IS 'Fast lookup of available ticket types';
COMMENT ON INDEX idx_orders_user_status_date IS 'Optimizes user order history';
COMMENT ON INDEX idx_users_google_tokens IS 'Fast lookup of users with Google Calendar integration'; 