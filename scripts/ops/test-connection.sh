#!/bin/bash

# Simple test script to debug Supabase connection
set -euo pipefail

echo "🔍 Testing Supabase Connection"
echo "================================"

# Check environment variables
echo "Environment Variables:"
echo "SUPABASE_PROJECT_REF: ${SUPABASE_PROJECT_REF:-NOT_SET}"
echo "SUPABASE_DB_PASSWORD: ${SUPABASE_DB_PASSWORD:+SET}"
echo "SUPABASE_POOLER_HOST: ${SUPABASE_POOLER_HOST:-NOT_SET}"
echo "SUPABASE_POOLER_PORT: ${SUPABASE_POOLER_PORT:-NOT_SET}"
echo ""

# Check if required variables are set
if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    echo "❌ SUPABASE_PROJECT_REF is not set"
    exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "❌ SUPABASE_DB_PASSWORD is not set"
    exit 1
fi

if [[ -z "${SUPABASE_POOLER_HOST:-}" ]]; then
    echo "❌ SUPABASE_POOLER_HOST is not set"
    exit 1
fi

if [[ -z "${SUPABASE_POOLER_PORT:-}" ]]; then
    echo "❌ SUPABASE_POOLER_PORT is not set"
    exit 1
fi

echo "✅ All environment variables are set"
echo ""

# Construct connection URL
DB_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@${SUPABASE_POOLER_HOST}:${SUPABASE_POOLER_PORT}/postgres"
DB_URL_SAFE="${DB_URL//:${SUPABASE_DB_PASSWORD}@/:***@}"

echo "Connection URL (masked): ${DB_URL_SAFE}"
echo ""

# Test network connectivity
echo "🌐 Testing network connectivity..."
if timeout 10 nc -zv "${SUPABASE_POOLER_HOST}" "${SUPABASE_POOLER_PORT}"; then
    echo "✅ Network connectivity successful"
else
    echo "❌ Network connectivity failed"
    exit 1
fi
echo ""

# Test PostgreSQL connection
echo "🗄️ Testing PostgreSQL connection..."
if timeout 30 psql "${DB_URL}" -c "SELECT 1 as test, current_database(), current_user, version();" 2>&1; then
    echo "✅ PostgreSQL connection successful"
else
    echo "❌ PostgreSQL connection failed"
    exit 1
fi
echo ""

# Test pg_dump permissions (schema only)
echo "🔄 Testing pg_dump permissions (schema only)..."
if timeout 60 pg_dump "${DB_URL}" --schema-only --no-owner --no-privileges 2>&1; then
    echo "✅ pg_dump schema permissions successful"
else
    echo "❌ pg_dump schema permissions failed"
    exit 1
fi
echo ""

# Test pg_dump with data (like backup script)
echo "🔄 Testing pg_dump with data (like backup script)..."
echo "Running: pg_dump with verbose output to diagnose issues..."

# Create a temporary file for the dump
TEMP_DUMP="/tmp/test_dump.sql"

# Run pg_dump with detailed error reporting
if pg_dump "${DB_URL}" \
    --verbose \
    --no-owner \
    --no-privileges \
    --format=plain \
    --file="${TEMP_DUMP}" 2>&1; then
    
    echo "✅ pg_dump with data successful"
    echo "📊 Dump file size: $(du -h "${TEMP_DUMP}" 2>/dev/null || echo 'unknown')"
    echo "📝 First 10 lines of dump:"
    head -10 "${TEMP_DUMP}" 2>/dev/null || echo "Could not read dump file"
    
    # Clean up
    rm -f "${TEMP_DUMP}"
else
    echo "❌ pg_dump with data failed"
    echo "🔍 Attempting to get more specific error information..."
    
    # Try a simpler dump to see what specific error we get
    echo "Testing with minimal options..."
    pg_dump "${DB_URL}" --version
    
    echo "Testing connection with psql again..."
    psql "${DB_URL}" -c "SELECT count(*) FROM information_schema.tables;" 2>&1 || echo "Table count query failed"
    
    echo "Testing basic pg_dump..."
    pg_dump "${DB_URL}" --schema-only --table=auth.users 2>&1 || echo "Single table schema dump failed"
    
    exit 1
fi
echo ""

echo "🎉 All tests passed!" 