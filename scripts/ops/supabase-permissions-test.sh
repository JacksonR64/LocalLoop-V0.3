#!/bin/bash

# Supabase-specific permissions test
set -euo pipefail

echo "🔍 Testing Supabase Database Permissions"
echo "========================================"

# Check environment variables
if [[ -z "${SUPABASE_PROJECT_REF:-}" ]] || [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "❌ Required environment variables not set"
    exit 1
fi

# Construct connection URL
DB_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@${SUPABASE_POOLER_HOST:-aws-0-eu-west-2.pooler.supabase.com}:${SUPABASE_POOLER_PORT:-6543}/postgres"

echo "🔐 Testing user permissions and access..."

# Test 1: Check current user and database
echo "1️⃣ Current user and database info:"
psql "${DB_URL}" -c "
SELECT 
    current_user as current_user,
    current_database() as database,
    session_user as session_user,
    version() as postgres_version;
" 2>&1 || echo "❌ Failed to get user info"

# Test 2: Check available schemas
echo -e "\n2️⃣ Available schemas:"
psql "${DB_URL}" -c "
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;
" 2>&1 || echo "❌ Failed to list schemas"

# Test 3: Check table access in different schemas
echo -e "\n3️⃣ Table access by schema:"
for schema in public auth storage realtime; do
    echo "  Testing ${schema} schema..."
    psql "${DB_URL}" -c "
    SELECT COUNT(*) as table_count 
    FROM information_schema.tables 
    WHERE table_schema = '${schema}';
    " 2>&1 | grep -E "(table_count|ERROR)" || echo "    ❌ Failed to access ${schema} schema"
done

# Test 4: Check specific permissions
echo -e "\n4️⃣ Testing pg_dump permissions on different schemas:"

# Test public schema only
echo "  Testing public schema dump..."
if pg_dump "${DB_URL}" --schema=public --schema-only --no-owner --no-privileges 2>/dev/null | head -5 > /dev/null; then
    echo "  ✅ Public schema dump works"
else
    echo "  ❌ Public schema dump failed"
fi

# Test auth schema (this often fails in Supabase)
echo "  Testing auth schema dump..."
if pg_dump "${DB_URL}" --schema=auth --schema-only --no-owner --no-privileges 2>/dev/null | head -5 > /dev/null; then
    echo "  ✅ Auth schema dump works"
else
    echo "  ❌ Auth schema dump failed (expected in Supabase)"
fi

# Test 5: Check RLS policies
echo -e "\n5️⃣ Checking Row Level Security (RLS) status:"
psql "${DB_URL}" -c "
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;
" 2>&1 || echo "❌ Failed to check RLS status"

# Test 6: Test data access vs schema access
echo -e "\n6️⃣ Testing data access vs schema access:"

# Schema only (should work)
echo "  Schema-only dump test..."
if timeout 30 pg_dump "${DB_URL}" --schema-only --no-owner --no-privileges 2>/dev/null | wc -l > /dev/null; then
    echo "  ✅ Schema-only dump works"
else
    echo "  ❌ Schema-only dump failed"
fi

# Data dump (might fail due to RLS)
echo "  Data dump test..."
if timeout 60 pg_dump "${DB_URL}" --data-only --no-owner --no-privileges --schema=public 2>/dev/null | head -10 > /dev/null; then
    echo "  ✅ Data dump works"
else
    echo "  ❌ Data dump failed (likely RLS or permissions)"
fi

echo -e "\n🎯 DIAGNOSIS COMPLETE"
echo "If auth schema access failed and data dump failed, this is likely a Supabase limitation."
echo "Supabase restricts access to system schemas and may have RLS policies preventing full dumps." 