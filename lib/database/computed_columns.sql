-- Additional Computed Columns for LocalLoop Database
-- Derived values to optimize query performance and reduce client-side calculations
-- Google Calendar API Integration Support

-- NOTE: events.status computed column is already implemented in the main schema

-- ================================
-- EVENTS TABLE COMPUTED COLUMNS
-- ================================

-- Calculate confirmed RSVP count for each event
ALTER TABLE events ADD COLUMN rsvp_count integer GENERATED ALWAYS AS (
  (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed')
) STORED;

-- Calculate spots remaining (NULL if no capacity limit)
ALTER TABLE events ADD COLUMN spots_remaining integer GENERATED ALWAYS AS (
  CASE 
    WHEN capacity IS NULL THEN NULL
    ELSE capacity - (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed')
  END
) STORED;

-- Boolean flag for if event is at capacity
ALTER TABLE events ADD COLUMN is_full boolean GENERATED ALWAYS AS (
  CASE 
    WHEN capacity IS NULL THEN false
    ELSE (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed') >= capacity
  END
) STORED;

-- Boolean flag for if RSVP/ticket sales are open
ALTER TABLE events ADD COLUMN is_open_for_registration boolean GENERATED ALWAYS AS (
  published = true 
  AND cancelled = false 
  AND start_time > now()
  AND (capacity IS NULL OR (SELECT COUNT(*) FROM rsvps WHERE event_id = events.id AND status = 'confirmed') < capacity)
) STORED;

-- Calculate net revenue for paid events (after refunds)
ALTER TABLE events ADD COLUMN total_revenue integer GENERATED ALWAYS AS (
  CASE 
    WHEN is_paid = false THEN 0
    ELSE (
      SELECT COALESCE(SUM(orders.total_amount - orders.refund_amount), 0)
      FROM orders 
      WHERE orders.event_id = events.id 
      AND orders.status = 'completed'
    )
  END
) STORED;

-- ================================
-- USERS TABLE COMPUTED COLUMNS  
-- ================================

-- Display name with email fallback
ALTER TABLE users ADD COLUMN display_name_or_email text GENERATED ALWAYS AS (
  COALESCE(display_name, split_part(email, '@', 1))
) STORED;

-- Boolean flag for Google Calendar connection status
ALTER TABLE users ADD COLUMN has_valid_google_calendar boolean GENERATED ALWAYS AS (
  google_calendar_connected = true 
  AND google_calendar_access_token IS NOT NULL
  AND (google_calendar_token_expires_at IS NULL OR google_calendar_token_expires_at > now())
) STORED;

-- ================================
-- TICKET_TYPES TABLE COMPUTED COLUMNS
-- ================================

-- Calculate tickets sold for this ticket type (excluding fully refunded tickets)
ALTER TABLE ticket_types ADD COLUMN tickets_sold integer GENERATED ALWAYS AS (
  (
    SELECT COALESCE(SUM(tickets.quantity), 0)
    FROM tickets 
    INNER JOIN orders ON tickets.order_id = orders.id
    WHERE tickets.ticket_type_id = ticket_types.id 
    AND orders.status = 'completed'
    -- Exclude fully refunded orders from inventory count
    AND (orders.refund_amount = 0 OR orders.refund_amount < orders.total_amount)
  )
) STORED;

-- Calculate tickets remaining (NULL if no capacity limit, accounting for refunds)
ALTER TABLE ticket_types ADD COLUMN tickets_remaining integer GENERATED ALWAYS AS (
  CASE 
    WHEN capacity IS NULL THEN NULL
    ELSE capacity - (
      SELECT COALESCE(SUM(tickets.quantity), 0)
      FROM tickets 
      INNER JOIN orders ON tickets.order_id = orders.id
      WHERE tickets.ticket_type_id = ticket_types.id 
      AND orders.status = 'completed'
      -- Exclude fully refunded orders from inventory count
      AND (orders.refund_amount = 0 OR orders.refund_amount < orders.total_amount)
    )
  END
) STORED;

-- Boolean flag for if ticket type is available for purchase (accounting for refunds)
ALTER TABLE ticket_types ADD COLUMN is_available boolean GENERATED ALWAYS AS (
  (sale_start IS NULL OR sale_start <= now())
  AND (sale_end IS NULL OR sale_end >= now())
  AND (capacity IS NULL OR (
    SELECT COALESCE(SUM(tickets.quantity), 0)
    FROM tickets 
    INNER JOIN orders ON tickets.order_id = orders.id
    WHERE tickets.ticket_type_id = ticket_types.id 
    AND orders.status = 'completed'
    -- Exclude fully refunded orders from inventory count
    AND (orders.refund_amount = 0 OR orders.refund_amount < orders.total_amount)
  ) < capacity)
) STORED;

-- Calculate net revenue for this ticket type (after refunds)
ALTER TABLE ticket_types ADD COLUMN total_revenue integer GENERATED ALWAYS AS (
  (
    SELECT COALESCE(SUM(
      tickets.quantity * tickets.unit_price * 
      -- Calculate the non-refunded portion of each order
      CASE 
        WHEN orders.refund_amount = 0 THEN 1
        WHEN orders.refund_amount >= orders.total_amount THEN 0
        ELSE (orders.total_amount - orders.refund_amount)::decimal / orders.total_amount
      END
    ), 0)::integer
    FROM tickets 
    INNER JOIN orders ON tickets.order_id = orders.id
    WHERE tickets.ticket_type_id = ticket_types.id 
    AND orders.status = 'completed'
  )
) STORED;

-- Track refunded tickets for this ticket type (new column)
ALTER TABLE ticket_types ADD COLUMN tickets_refunded integer GENERATED ALWAYS AS (
  (
    SELECT COALESCE(SUM(
      tickets.quantity * 
      -- Calculate refunded portion
      CASE 
        WHEN orders.refund_amount = 0 THEN 0
        WHEN orders.refund_amount >= orders.total_amount THEN 1
        ELSE (orders.refund_amount::decimal / orders.total_amount)
      END
    ), 0)::integer
    FROM tickets 
    INNER JOIN orders ON tickets.order_id = orders.id
    WHERE tickets.ticket_type_id = ticket_types.id 
    AND orders.status = 'completed'
    AND orders.refund_amount > 0
  )
) STORED;

-- ================================
-- ORDERS TABLE COMPUTED COLUMNS
-- ================================

-- Calculate total number of tickets in order
ALTER TABLE orders ADD COLUMN tickets_count integer GENERATED ALWAYS AS (
  (SELECT COALESCE(SUM(quantity), 0) FROM tickets WHERE order_id = orders.id)
) STORED;

-- Boolean flag for if order can be refunded
ALTER TABLE orders ADD COLUMN is_refundable boolean GENERATED ALWAYS AS (
  status = 'completed' 
  AND refunded_at IS NULL
  AND refund_amount < total_amount
  -- Add business rule: can refund up to 24 hours before event
  AND EXISTS (
    SELECT 1 FROM events 
    WHERE id = orders.event_id 
    AND start_time > (now() + interval '24 hours')
  )
) STORED;

-- Calculate net amount after refunds
ALTER TABLE orders ADD COLUMN net_amount integer GENERATED ALWAYS AS (
  total_amount - refund_amount
) STORED;

-- Boolean flag for Google Calendar integration status
ALTER TABLE orders ADD COLUMN calendar_integration_status text GENERATED ALWAYS AS (
  CASE 
    WHEN added_to_google_calendar = true THEN 'added'
    WHEN calendar_add_attempted_at IS NOT NULL AND calendar_add_error IS NOT NULL THEN 'failed'
    WHEN calendar_add_attempted_at IS NOT NULL THEN 'pending'
    ELSE 'not_attempted'
  END
) STORED;

-- ================================
-- RSVPS TABLE COMPUTED COLUMNS
-- ================================

-- Boolean flag for Google Calendar integration status
ALTER TABLE rsvps ADD COLUMN calendar_integration_status text GENERATED ALWAYS AS (
  CASE 
    WHEN added_to_google_calendar = true THEN 'added'
    WHEN calendar_add_attempted_at IS NOT NULL AND calendar_add_error IS NOT NULL THEN 'failed'
    WHEN calendar_add_attempted_at IS NOT NULL THEN 'pending'
    ELSE 'not_attempted'
  END
) STORED;

-- Boolean flag for if RSVP can be cancelled
ALTER TABLE rsvps ADD COLUMN is_cancellable boolean GENERATED ALWAYS AS (
  status = 'confirmed'
  -- Add business rule: can cancel up to 2 hours before event
  AND EXISTS (
    SELECT 1 FROM events 
    WHERE id = rsvps.event_id 
    AND start_time > (now() + interval '2 hours')
  )
) STORED;

-- ================================
-- TICKETS TABLE COMPUTED COLUMNS
-- ================================

-- Calculate total price for this ticket (quantity * unit_price)
ALTER TABLE tickets ADD COLUMN total_price integer GENERATED ALWAYS AS (
  quantity * unit_price
) STORED;

-- Boolean flag for if ticket has been used (checked in)
ALTER TABLE tickets ADD COLUMN is_used boolean GENERATED ALWAYS AS (
  check_in_time IS NOT NULL
) STORED;

-- Boolean flag for if ticket is valid (order completed, not checked in, event not past)
ALTER TABLE tickets ADD COLUMN is_valid boolean GENERATED ALWAYS AS (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = tickets.order_id 
    AND status = 'completed'
  )
  AND check_in_time IS NULL
  AND EXISTS (
    SELECT 1 FROM events e
    INNER JOIN orders o ON e.id = o.event_id
    WHERE o.id = tickets.order_id
    AND e.end_time >= now()
  )
) STORED;

-- ================================
-- DOCUMENTATION AND COMMENTS
-- ================================

-- Events computed columns
COMMENT ON COLUMN events.rsvp_count IS 'Real-time count of confirmed RSVPs for dashboard display';
COMMENT ON COLUMN events.spots_remaining IS 'Remaining capacity for event registration, NULL if unlimited';
COMMENT ON COLUMN events.is_full IS 'Boolean flag indicating if event has reached capacity';
COMMENT ON COLUMN events.is_open_for_registration IS 'Boolean flag for if event accepts new registrations';
COMMENT ON COLUMN events.total_revenue IS 'Net revenue after refunds for this event';

-- Users computed columns  
COMMENT ON COLUMN users.display_name_or_email IS 'Display name with email fallback for consistent UI display';
COMMENT ON COLUMN users.has_valid_google_calendar IS 'Boolean flag for valid Google Calendar API access';

-- Ticket types computed columns
COMMENT ON COLUMN ticket_types.tickets_sold IS 'Count of tickets sold from completed orders, excluding fully refunded tickets';
COMMENT ON COLUMN ticket_types.tickets_remaining IS 'Remaining ticket capacity accounting for refunds, NULL if unlimited';
COMMENT ON COLUMN ticket_types.is_available IS 'Boolean flag for if tickets can be purchased now, accounting for refunds';
COMMENT ON COLUMN ticket_types.total_revenue IS 'Net revenue after refunds for this ticket type';
COMMENT ON COLUMN ticket_types.tickets_refunded IS 'Count of tickets that have been refunded (full or partial)';

-- Orders computed columns
COMMENT ON COLUMN orders.tickets_count IS 'Total number of tickets in this order';
COMMENT ON COLUMN orders.is_refundable IS 'Boolean flag based on order status and refund policy';
COMMENT ON COLUMN orders.net_amount IS 'Order amount after refunds applied';
COMMENT ON COLUMN orders.calendar_integration_status IS 'Google Calendar integration status for order';

-- RSVPs computed columns
COMMENT ON COLUMN rsvps.calendar_integration_status IS 'Google Calendar integration status for RSVP';
COMMENT ON COLUMN rsvps.is_cancellable IS 'Boolean flag based on cancellation policy and event timing';

-- Tickets computed columns
COMMENT ON COLUMN tickets.total_price IS 'Total price for ticket (quantity * unit_price)';
COMMENT ON COLUMN tickets.is_used IS 'Boolean flag indicating if ticket has been checked in';
COMMENT ON COLUMN tickets.is_valid IS 'Boolean flag for ticket validity (order complete, not used, event future)';

-- Performance note: These computed columns are STORED, meaning they are calculated 
-- when data changes and stored physically. This trades storage space for query speed.
-- For high-traffic scenarios, consider monitoring storage usage and query performance. 