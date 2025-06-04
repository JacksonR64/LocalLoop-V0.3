-- Add customer information columns to tickets table
-- This allows storing customer details for both logged-in users and guests

-- Add missing columns to tickets table for Stripe webhook compatibility
-- This allows storing tickets created directly from Stripe webhooks without requiring orders

-- Make order_id optional to support direct ticket creation
ALTER TABLE tickets ALTER COLUMN order_id DROP NOT NULL;

-- Add missing columns for Stripe webhook support
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS purchase_price integer, -- in cents
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_intent ON tickets(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Add constraint to ensure either order_id or event_id is present
ALTER TABLE tickets ADD CONSTRAINT tickets_order_or_event_check 
CHECK (order_id IS NOT NULL OR event_id IS NOT NULL);

-- Add comments to document the purpose
COMMENT ON COLUMN tickets.customer_email IS 'Email address of the ticket purchaser (for both users and guests)';
COMMENT ON COLUMN tickets.customer_name IS 'Full name of the ticket purchaser (for both users and guests)';
COMMENT ON COLUMN tickets.purchase_price IS 'Price paid for this ticket in cents (can differ from ticket_type price due to discounts)';
COMMENT ON COLUMN tickets.payment_intent_id IS 'Stripe PaymentIntent ID for tracking payments';
COMMENT ON COLUMN tickets.event_id IS 'Direct event reference for tickets created via Stripe webhook';
COMMENT ON COLUMN tickets.user_id IS 'User who purchased the ticket (optional for guest purchases)';
COMMENT ON COLUMN tickets.status IS 'Ticket status: active, cancelled, refunded, etc.'; 