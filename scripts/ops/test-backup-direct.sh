#!/bin/bash

# Direct backup test - bypasses connection checks
# Tests if the RLS backup approach actually works

set -e

echo "🧪 Direct RLS Backup Test"
echo "=========================="

# Configuration
HOST="${SUPABASE_POOLER_HOST}"
PORT="${SUPABASE_POOLER_PORT}"
DATABASE="postgres"
ADMIN_USER="postgres.${SUPABASE_PROJECT_REF}"
BACKUP_USER="supabase_backup_user"
BACKUP_PASSWORD="backup_secure_password_2024"

echo "📋 Configuration:"
echo "  Host: ${HOST}"
echo "  Port: ${PORT}"
echo "  Database: ${DATABASE}"
echo "  Backup User: ${BACKUP_USER}"

# Set password for backup user
export PGPASSWORD="${BACKUP_PASSWORD}"

echo ""
echo "🚀 Testing RLS-compatible pg_dump..."

# Create test directory
mkdir -p test-backups

# Test the core backup command that was failing before
echo "📊 Testing schema backup with RLS..."
if pg_dump \
    -h "${HOST}" \
    -p "${PORT}" \
    -U "${BACKUP_USER}" \
    -d "${DATABASE}" \
    --schema-only \
    --enable-row-security \
    --no-owner \
    --no-privileges \
    --verbose \
    -f test-backups/schema-test.sql; then
    echo "✅ Schema backup successful!"
    
    # Check if file has content
    if [ -s test-backups/schema-test.sql ]; then
        echo "✅ Schema backup file contains data"
        echo "📏 File size: $(wc -l < test-backups/schema-test.sql) lines"
    else
        echo "⚠️ Schema backup file is empty"
    fi
else
    echo "❌ Schema backup failed"
    echo "🔍 This indicates the RLS approach may need adjustment"
fi

echo ""
echo "📊 Testing data backup with RLS..."
if pg_dump \
    -h "${HOST}" \
    -p "${PORT}" \
    -U "${BACKUP_USER}" \
    -d "${DATABASE}" \
    --data-only \
    --enable-row-security \
    --no-owner \
    --no-privileges \
    --verbose \
    -f test-backups/data-test.sql; then
    echo "✅ Data backup successful!"
    
    # Check if file has content
    if [ -s test-backups/data-test.sql ]; then
        echo "✅ Data backup file contains data"
        echo "📏 File size: $(wc -l < test-backups/data-test.sql) lines"
    else
        echo "⚠️ Data backup file is empty (may be normal if tables are empty)"
    fi
else
    echo "❌ Data backup failed"
    echo "🔍 This was the original issue we're trying to solve!"
fi

echo ""
echo "📊 Testing full backup with RLS..."
if pg_dump \
    -h "${HOST}" \
    -p "${PORT}" \
    -U "${BACKUP_USER}" \
    -d "${DATABASE}" \
    --enable-row-security \
    --no-owner \
    --no-privileges \
    --verbose \
    -f test-backups/full-test.sql; then
    echo "✅ Full backup successful!"
    
    # Check if file has content
    if [ -s test-backups/full-test.sql ]; then
        echo "✅ Full backup file contains data"
        echo "📏 File size: $(wc -l < test-backups/full-test.sql) lines"
        
        # Show first few lines to verify content
        echo ""
        echo "📄 First 10 lines of backup:"
        head -10 test-backups/full-test.sql
    else
        echo "⚠️ Full backup file is empty"
    fi
else
    echo "❌ Full backup failed"
    echo "🔍 This indicates a fundamental issue with the approach"
fi

echo ""
echo "🎯 Direct backup test completed!"
echo ""
echo "📁 Generated test files:"
ls -la test-backups/ || echo "No test files generated"

# Clean up password
unset PGPASSWORD

echo ""
echo "✅ Direct backup test finished" 