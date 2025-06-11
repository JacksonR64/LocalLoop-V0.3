-- Supabase Backup User Setup
-- Based on official Supabase documentation for RLS-compatible backups
-- https://supabase.com/blog/partial-postgresql-data-dumps-with-rls

-- Step 1: Create a dedicated backup user
CREATE USER supabase_backup_user WITH PASSWORD 'backup_secure_password_2024';

-- Step 2: Grant necessary schema access
GRANT USAGE ON SCHEMA public TO supabase_backup_user;
GRANT USAGE ON SCHEMA auth TO supabase_backup_user;
GRANT USAGE ON SCHEMA storage TO supabase_backup_user;

-- Step 3: Grant SELECT access to all tables in public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO supabase_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO supabase_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO supabase_backup_user;

-- Step 4: Grant access to sequences (for complete backups)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO supabase_backup_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA auth TO supabase_backup_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA storage TO supabase_backup_user;

-- Step 5: Create RLS policies for backup user to access all data
-- Note: This user will have read-only access to all data for backup purposes

-- For each table with RLS enabled, create a policy allowing backup user full read access
-- These policies will be added dynamically based on existing tables

-- Events table backup policy
CREATE POLICY "Backup user can read all events" ON public.events
    FOR SELECT
    TO supabase_backup_user
    USING (true);

-- Users/profiles backup policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        EXECUTE 'CREATE POLICY "Backup user can read all profiles" ON public.profiles FOR SELECT TO supabase_backup_user USING (true)';
    END IF;
END
$$;

-- RSVPs backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rsvps') THEN
        EXECUTE 'CREATE POLICY "Backup user can read all rsvps" ON public.rsvps FOR SELECT TO supabase_backup_user USING (true)';
    END IF;
END
$$;

-- Event updates backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_updates') THEN
        EXECUTE 'CREATE POLICY "Backup user can read all event_updates" ON public.event_updates FOR SELECT TO supabase_backup_user USING (true)';
    END IF;
END
$$;

-- Ticket types backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_types') THEN
        EXECUTE 'CREATE POLICY "Backup user can read all ticket_types" ON public.ticket_types FOR SELECT TO supabase_backup_user USING (true)';
    END IF;
END
$$;

-- Orders backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        EXECUTE 'CREATE POLICY "Backup user can read all orders" ON public.orders FOR SELECT TO supabase_backup_user USING (true)';
    END IF;
END
$$;

-- Order items backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        EXECUTE 'CREATE POLICY "Backup user can read all order_items" ON public.order_items FOR SELECT TO supabase_backup_user USING (true)';
    END IF;
END
$$;

-- Note: Auth schema tables typically don't allow custom RLS policies
-- The backup user permissions should be sufficient for auth schema access

COMMENT ON ROLE supabase_backup_user IS 'Dedicated user for database backups with RLS policies allowing full read access'; 