-- Supabase Backup User Setup
-- Based on official Supabase documentation for RLS-compatible backups
-- https://supabase.com/blog/partial-postgresql-data-dumps-with-rls

-- Step 1: Create or update the backup user
-- Handle case where user already exists
DO $$
BEGIN
    -- Check if user exists and drop/recreate to ensure clean state
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_backup_user') THEN
        RAISE NOTICE 'Dropping existing backup user to recreate with fresh permissions';
        
        -- Drop existing policies first, but only if tables exist
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
            DROP POLICY IF EXISTS "Backup user can read all events" ON public.events;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
            DROP POLICY IF EXISTS "Backup user can read all profiles" ON public.profiles;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rsvps') THEN
            DROP POLICY IF EXISTS "Backup user can read all rsvps" ON public.rsvps;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_updates') THEN
            DROP POLICY IF EXISTS "Backup user can read all event_updates" ON public.event_updates;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_types') THEN
            DROP POLICY IF EXISTS "Backup user can read all ticket_types" ON public.ticket_types;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
            DROP POLICY IF EXISTS "Backup user can read all orders" ON public.orders;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
            DROP POLICY IF EXISTS "Backup user can read all order_items" ON public.order_items;
        END IF;
        
        -- Drop and recreate user to ensure clean state
        DROP USER supabase_backup_user CASCADE;
    END IF;
    
    -- Create the backup user with known password
    RAISE NOTICE 'Creating backup user with password';
    CREATE USER supabase_backup_user WITH PASSWORD 'backup_secure_password_2024';
END
$$;

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

-- Events table backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        CREATE POLICY "Backup user can read all events" ON public.events
            FOR SELECT
            TO supabase_backup_user
            USING (true);
        RAISE NOTICE 'Created RLS policy for events table';
    ELSE
        RAISE NOTICE 'Events table not found, skipping policy';
    END IF;
END
$$;

-- Users/profiles backup policy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE POLICY "Backup user can read all profiles" ON public.profiles 
            FOR SELECT 
            TO supabase_backup_user 
            USING (true);
        RAISE NOTICE 'Created RLS policy for profiles table';
    ELSE
        RAISE NOTICE 'Profiles table not found, skipping policy';
    END IF;
END
$$;

-- RSVPs backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rsvps') THEN
        CREATE POLICY "Backup user can read all rsvps" ON public.rsvps 
            FOR SELECT 
            TO supabase_backup_user 
            USING (true);
        RAISE NOTICE 'Created RLS policy for rsvps table';
    ELSE
        RAISE NOTICE 'RSVPs table not found, skipping policy';
    END IF;
END
$$;

-- Event updates backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_updates') THEN
        CREATE POLICY "Backup user can read all event_updates" ON public.event_updates 
            FOR SELECT 
            TO supabase_backup_user 
            USING (true);
        RAISE NOTICE 'Created RLS policy for event_updates table';
    ELSE
        RAISE NOTICE 'Event_updates table not found, skipping policy';
    END IF;
END
$$;

-- Ticket types backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_types') THEN
        CREATE POLICY "Backup user can read all ticket_types" ON public.ticket_types 
            FOR SELECT 
            TO supabase_backup_user 
            USING (true);
        RAISE NOTICE 'Created RLS policy for ticket_types table';
    ELSE
        RAISE NOTICE 'Ticket_types table not found, skipping policy';
    END IF;
END
$$;

-- Orders backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        CREATE POLICY "Backup user can read all orders" ON public.orders 
            FOR SELECT 
            TO supabase_backup_user 
            USING (true);
        RAISE NOTICE 'Created RLS policy for orders table';
    ELSE
        RAISE NOTICE 'Orders table not found, skipping policy';
    END IF;
END
$$;

-- Order items backup policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        CREATE POLICY "Backup user can read all order_items" ON public.order_items 
            FOR SELECT 
            TO supabase_backup_user 
            USING (true);
        RAISE NOTICE 'Created RLS policy for order_items table';
    ELSE
        RAISE NOTICE 'Order_items table not found, skipping policy';
    END IF;
END
$$;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Backup user setup completed successfully';
    RAISE NOTICE 'User: supabase_backup_user';
    RAISE NOTICE 'Password: backup_secure_password_2024';
    RAISE NOTICE 'Permissions: SELECT on public, auth, storage schemas';
END
$$;

-- Note: Auth schema tables typically don't allow custom RLS policies
-- The backup user permissions should be sufficient for auth schema access

COMMENT ON ROLE supabase_backup_user IS 'Dedicated user for database backups with RLS policies allowing full read access - Fixed table existence checks'; 