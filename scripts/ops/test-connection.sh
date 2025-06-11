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
if timeout 120 pg_dump "${DB_URL}" --verbose --no-owner --no-privileges --format=plain 2>&1 | head -50; then
    echo "✅ pg_dump with data successful"
else
    echo "❌ pg_dump with data failed"
    exit 1
fi
echo ""

echo "🎉 All tests passed!" 