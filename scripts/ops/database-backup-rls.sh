#!/bin/bash

# Supabase RLS-Compatible Database Backup Script
# Based on official Supabase documentation
# https://supabase.com/blog/partial-postgresql-data-dumps-with-rls

set -e  # Exit on any error

# Configuration
BACKUP_USER="supabase_backup_user"
BACKUP_PASSWORD="backup_secure_password_2024"
HOST="${SUPABASE_POOLER_HOST:-aws-0-eu-west-2.pooler.supabase.com}"
PORT="${SUPABASE_POOLER_PORT:-6543}"
DATABASE="postgres"
PROJECT_REF="${SUPABASE_PROJECT_REF}"

# Backup settings
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/localloop_backup_${TIMESTAMP}.sql"
SCHEMA_FILE="${BACKUP_DIR}/localloop_schema_${TIMESTAMP}.sql"

echo "🚀 Starting Supabase RLS-Compatible Database Backup"
echo "📅 Timestamp: $TIMESTAMP"
echo "🏠 Host: $HOST:$PORT"
echo "🗄️ Database: $DATABASE"
echo "👤 User: $BACKUP_USER"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Connection string for backup user
export PGPASSWORD="$BACKUP_PASSWORD"
CONNECTION_STRING="postgresql://${BACKUP_USER}:${BACKUP_PASSWORD}@${HOST}:${PORT}/${DATABASE}"

echo "🔍 Testing connection with backup user..."

# Test connection first
if ! psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect with backup user. Please ensure:"
    echo "   1. Backup user is created (run create-backup-user.sql)"
    echo "   2. RLS policies are configured for backup user"
    echo "   3. Connection details are correct"
    exit 1
fi

echo "✅ Connection successful with backup user"

echo "📋 Creating schema-only backup..."

# Create schema-only backup (this should work regardless of RLS)
pg_dump \
    -h "$HOST" \
    -p "$PORT" \
    -U "$BACKUP_USER" \
    -d "$DATABASE" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --file="$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Schema backup created: $SCHEMA_FILE"
    SCHEMA_SIZE=$(du -h "$SCHEMA_FILE" | cut -f1)
    echo "📊 Schema backup size: $SCHEMA_SIZE"
else
    echo "❌ ERROR: Schema backup failed"
    exit 1
fi

echo "💾 Creating data backup with RLS support..."

# Create data-only backup with RLS support
pg_dump \
    -h "$HOST" \
    -p "$PORT" \
    -U "$BACKUP_USER" \
    -d "$DATABASE" \
    --data-only \
    --no-owner \
    --no-privileges \
    --enable-row-security \
    --disable-triggers \
    --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Data backup created: $BACKUP_FILE"
    DATA_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📊 Data backup size: $DATA_SIZE"
else
    echo "❌ ERROR: Data backup failed"
    echo "🔍 Checking if RLS policies are configured..."
    
    # Check for RLS policies
    psql "$CONNECTION_STRING" -c "
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE roles @> ARRAY['$BACKUP_USER'] 
        ORDER BY schemaname, tablename;
    " || echo "⚠️ Could not check RLS policies"
    
    exit 1
fi

echo "🔗 Creating combined backup file..."

# Create a combined backup file
COMBINED_FILE="${BACKUP_DIR}/localloop_combined_${TIMESTAMP}.sql"
{
    echo "-- LocalLoop Database Backup"
    echo "-- Generated: $(date)"
    echo "-- Schema + Data backup with RLS support"
    echo ""
    cat "$SCHEMA_FILE"
    echo ""
    echo "-- DATA SECTION"
    echo ""
    cat "$BACKUP_FILE"
} > "$COMBINED_FILE"

COMBINED_SIZE=$(du -h "$COMBINED_FILE" | cut -f1)
echo "✅ Combined backup created: $COMBINED_FILE"
echo "📊 Combined backup size: $COMBINED_SIZE"

# Verify backup integrity
echo "🔍 Verifying backup integrity..."

# Check if files contain expected content
if grep -q "CREATE TABLE" "$SCHEMA_FILE" && grep -q "INSERT INTO\|COPY" "$BACKUP_FILE"; then
    echo "✅ Backup integrity check passed"
else
    echo "⚠️ WARNING: Backup may be incomplete"
    echo "   Schema file contains CREATE TABLE: $(grep -q "CREATE TABLE" "$SCHEMA_FILE" && echo "YES" || echo "NO")"
    echo "   Data file contains INSERT/COPY: $(grep -q "INSERT INTO\|COPY" "$BACKUP_FILE" && echo "YES" || echo "NO")"
fi

# Clean up old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "localloop_*_*.sql" -type f | sort -r | tail -n +16 | xargs -r rm
echo "✅ Cleanup completed"

echo ""
echo "🎉 Backup completed successfully!"
echo "📁 Files created:"
echo "   - Schema: $SCHEMA_FILE ($SCHEMA_SIZE)"
echo "   - Data: $BACKUP_FILE ($DATA_SIZE)"  
echo "   - Combined: $COMBINED_FILE ($COMBINED_SIZE)"
echo ""
echo "🔧 To restore this backup:"
echo "   psql [connection] -f $COMBINED_FILE"
echo ""

# Unset password for security
unset PGPASSWORD 