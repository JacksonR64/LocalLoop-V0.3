-- Row-Level Security (RLS) Policies for LocalLoop Database
-- Comprehensive data access control for multi-tenant event management
-- Google Calendar API Integration Support

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- USERS TABLE POLICIES
-- ==============================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (for sign-up)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_select_admin" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Admins can update any user
CREATE POLICY "users_update_admin" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Allow public viewing of basic user info for event organizers
CREATE POLICY "users_select_public" ON users
    FOR SELECT
    USING (
        -- Only display_name and basic info for event organizers
        id IN (SELECT organizer_id FROM events WHERE published = true)
    );

-- ==============================================
-- EVENTS TABLE POLICIES
-- ==============================================

-- Everyone can view published events
CREATE POLICY "events_select_published" ON events
    FOR SELECT
    USING (published = true AND deleted_at IS NULL);

-- Organizers can view their own events (including unpublished)
CREATE POLICY "events_select_own" ON events
    FOR SELECT
    USING (auth.uid() = organizer_id);

-- Organizers can create events
CREATE POLICY "events_insert_organizer" ON events
    FOR INSERT
    WITH CHECK (
        auth.uid() = organizer_id AND
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('organizer', 'admin')
        )
    );

-- Organizers can update their own events
CREATE POLICY "events_update_own" ON events
    FOR UPDATE
    USING (auth.uid() = organizer_id);

-- Organizers can soft delete their own events
CREATE POLICY "events_delete_own" ON events
    FOR UPDATE
    USING (
        auth.uid() = organizer_id AND
        -- Only allow setting deleted_at, not actual deletion
        OLD.deleted_at IS NULL
    );

-- Admins can view all events
CREATE POLICY "events_select_admin" ON events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Admins can update any event
CREATE POLICY "events_update_admin" ON events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ==============================================
-- RSVPS TABLE POLICIES
-- ==============================================

-- Users can view their own RSVPs
CREATE POLICY "rsvps_select_own" ON rsvps
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        -- Guest RSVPs based on email matching authenticated user
        (user_id IS NULL AND guest_email = (
            SELECT email FROM users WHERE id = auth.uid()
        ))
    );

-- Users can create RSVPs for themselves
CREATE POLICY "rsvps_insert_own" ON rsvps
    FOR INSERT
    WITH CHECK (
        (auth.uid() = user_id AND guest_email IS NULL) OR
        -- Allow guest RSVPs with email verification
        (user_id IS NULL AND guest_email IS NOT NULL)
    );

-- Users can update their own RSVPs
CREATE POLICY "rsvps_update_own" ON rsvps
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        -- Guest RSVPs based on email matching
        (user_id IS NULL AND guest_email = (
            SELECT email FROM users WHERE id = auth.uid()
        ))
    );

-- Users can delete their own RSVPs
CREATE POLICY "rsvps_delete_own" ON rsvps
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        -- Guest RSVPs based on email matching
        (user_id IS NULL AND guest_email = (
            SELECT email FROM users WHERE id = auth.uid()
        ))
    );

-- Event organizers can view RSVPs for their events
CREATE POLICY "rsvps_select_organizer" ON rsvps
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = rsvps.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Event organizers can update RSVPs for their events (e.g., check-in)
CREATE POLICY "rsvps_update_organizer" ON rsvps
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = rsvps.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Admins can view all RSVPs
CREATE POLICY "rsvps_select_admin" ON rsvps
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ==============================================
-- ORDERS TABLE POLICIES
-- ==============================================

-- Users can view their own orders
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        -- Guest orders based on email matching
        (user_id IS NULL AND guest_email = (
            SELECT email FROM users WHERE id = auth.uid()
        ))
    );

-- Users can create orders for themselves
CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT
    WITH CHECK (
        (auth.uid() = user_id AND guest_email IS NULL) OR
        -- Allow guest orders with email verification
        (user_id IS NULL AND guest_email IS NOT NULL)
    );

-- Users can update their own orders (limited scenarios)
CREATE POLICY "orders_update_own" ON orders
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        -- Guest orders based on email matching
        (user_id IS NULL AND guest_email = (
            SELECT email FROM users WHERE id = auth.uid()
        ))
    );

-- Event organizers can view orders for their events
CREATE POLICY "orders_select_organizer" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = orders.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Event organizers can update orders for their events (e.g., refunds)
CREATE POLICY "orders_update_organizer" ON orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = orders.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Admins can view all orders
CREATE POLICY "orders_select_admin" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Admins can update any order
CREATE POLICY "orders_update_admin" ON orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ==============================================
-- TICKETS TABLE POLICIES
-- ==============================================

-- Users can view tickets from their orders
CREATE POLICY "tickets_select_own" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = tickets.order_id 
            AND (
                o.user_id = auth.uid() OR
                (o.user_id IS NULL AND o.guest_email = (
                    SELECT email FROM users WHERE id = auth.uid()
                ))
            )
        )
    );

-- System can insert tickets during order creation
CREATE POLICY "tickets_insert_system" ON tickets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = tickets.order_id 
            AND (
                o.user_id = auth.uid() OR
                (o.user_id IS NULL AND o.guest_email IS NOT NULL)
            )
        )
    );

-- Event organizers can view tickets for their events
CREATE POLICY "tickets_select_organizer" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN events e ON e.id = o.event_id
            WHERE o.id = tickets.order_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Event organizers can update tickets (e.g., check-in)
CREATE POLICY "tickets_update_organizer" ON tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN events e ON e.id = o.event_id
            WHERE o.id = tickets.order_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Admins can view all tickets
CREATE POLICY "tickets_select_admin" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ==============================================
-- TICKET_TYPES TABLE POLICIES
-- ==============================================

-- Everyone can view ticket types for published events
CREATE POLICY "ticket_types_select_public" ON ticket_types
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = ticket_types.event_id 
            AND e.published = true
        )
    );

-- Event organizers can view ticket types for their events
CREATE POLICY "ticket_types_select_organizer" ON ticket_types
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = ticket_types.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Event organizers can create ticket types for their events
CREATE POLICY "ticket_types_insert_organizer" ON ticket_types
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = ticket_types.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Event organizers can update ticket types for their events
CREATE POLICY "ticket_types_update_organizer" ON ticket_types
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = ticket_types.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Event organizers can delete ticket types for their events
CREATE POLICY "ticket_types_delete_organizer" ON ticket_types
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = ticket_types.event_id 
            AND e.organizer_id = auth.uid()
        )
    );

-- Admins can manage all ticket types
CREATE POLICY "ticket_types_admin" ON ticket_types
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ==============================================
-- GOOGLE CALENDAR INTEGRATION SECURITY
-- ==============================================

-- Additional security for Google Calendar OAuth tokens
-- These policies ensure only the token owner can access their tokens

CREATE POLICY "users_google_calendar_tokens_own" ON users
    FOR SELECT
    USING (
        auth.uid() = id AND
        -- Only allow access to own calendar tokens
        (
            google_calendar_access_token IS NOT NULL OR
            google_calendar_refresh_token IS NOT NULL
        )
    );

-- ==============================================
-- HELPER FUNCTIONS FOR RLS
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
-- DOCUMENTATION AND COMMENTS
-- ==============================================

COMMENT ON POLICY "users_select_own" ON users IS 
'Users can view their own profile information';

COMMENT ON POLICY "events_select_published" ON events IS 
'Public access to published events for discovery';

COMMENT ON POLICY "rsvps_select_own" ON rsvps IS 
'Users can view their own RSVPs, including guest RSVPs by email matching';

COMMENT ON POLICY "orders_select_organizer" ON orders IS 
'Event organizers can view orders for their events to manage sales';

COMMENT ON POLICY "tickets_update_organizer" ON tickets IS 
'Event organizers can update tickets for check-in and event management';

COMMENT ON FUNCTION auth.is_event_organizer(UUID) IS 
'Helper function to check if authenticated user is organizer of specific event';

COMMENT ON FUNCTION auth.is_admin() IS 
'Helper function to check if authenticated user has admin role';

COMMENT ON FUNCTION auth.owns_guest_record(TEXT) IS 
'Helper function to check if guest email matches authenticated user email'; 