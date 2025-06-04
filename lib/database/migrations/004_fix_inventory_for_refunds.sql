-- Migration: Fix ticket inventory to account for refunded tickets
-- File: 004_fix_inventory_for_refunds.sql
-- Description: Updates computed columns to exclude fully refunded tickets from inventory calculations

-- Drop existing computed columns that don't account for refunds
ALTER TABLE ticket_types DROP COLUMN IF EXISTS tickets_sold;
ALTER TABLE ticket_types DROP COLUMN IF EXISTS tickets_remaining;
ALTER TABLE ticket_types DROP COLUMN IF EXISTS is_available;
ALTER TABLE ticket_types DROP COLUMN IF EXISTS total_revenue;

-- Recreate tickets_sold to exclude fully refunded orders
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

-- Recreate tickets_remaining with refund awareness
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

-- Recreate is_available with refund awareness
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

-- Recreate total_revenue excluding refunded amounts
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

-- Add new computed column to track refunded tickets for this ticket type
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

-- Update events table total_revenue to account for refunds
ALTER TABLE events DROP COLUMN IF EXISTS total_revenue;
ALTER TABLE events ADD COLUMN total_revenue integer GENERATED ALWAYS AS (
  (
    SELECT COALESCE(SUM(orders.total_amount - orders.refund_amount), 0)
    FROM orders 
    WHERE orders.event_id = events.id 
    AND orders.status = 'completed'
  )
) STORED;

-- Add comments for new columns
COMMENT ON COLUMN ticket_types.tickets_sold IS 'Count of tickets sold from completed orders, excluding fully refunded tickets';
COMMENT ON COLUMN ticket_types.tickets_remaining IS 'Remaining ticket capacity accounting for refunds, NULL if unlimited';
COMMENT ON COLUMN ticket_types.is_available IS 'Boolean flag for if tickets can be purchased now, accounting for refunds';
COMMENT ON COLUMN ticket_types.total_revenue IS 'Net revenue after refunds for this ticket type';
COMMENT ON COLUMN ticket_types.tickets_refunded IS 'Count of tickets that have been refunded (full or partial)';
COMMENT ON COLUMN events.total_revenue IS 'Net revenue after refunds for this event';

-- Validate the migration with a query to ensure inventory is calculated correctly
-- This query should show ticket types with proper inventory accounting
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Ticket inventory now accounts for refunds';
  RAISE NOTICE 'Computed columns updated: tickets_sold, tickets_remaining, is_available, total_revenue';
  RAISE NOTICE 'New column added: tickets_refunded for tracking refund statistics';
END $$; 