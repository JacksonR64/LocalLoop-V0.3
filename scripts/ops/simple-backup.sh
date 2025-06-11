#!/bin/bash

# Simple Supabase Database Backup
# Uses standard approach with admin postgres user
# Based on official Supabase documentation

set -e

echo "🗄️  LocalLoop Database Backup"
echo "============================="

# Configuration from environment
HOST="${SUPABASE_DB_HOST}"
PORT="${SUPABASE_DB_PORT:-5432}"
DATABASE="postgres"
USER="postgres.${SUPABASE_PROJECT_REF}"
PASSWORD="${SUPABASE_DB_PASSWORD}"

# Backup configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/localloop_backup_${TIMESTAMP}.sql"

echo "📋 Configuration:"
echo "  Host: ${HOST}"
echo "  Port: ${PORT}"
echo "  Database: ${DATABASE}"
echo "  User: ${USER}"
echo "  Backup file: ${BACKUP_FILE}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Set password for pg_dump
export PGPASSWORD="${PASSWORD}"

echo ""
echo "🚀 Creating database backup..."

# Standard pg_dump command (recommended by Supabase docs)
pg_dump \
  --host="${HOST}" \
  --port="${PORT}" \
  --username="${USER}" \
  --dbname="${DATABASE}" \
  --no-password \
  --verbose \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --file="${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo ""
    echo "✅ Backup completed successfully!"
    echo "   File: ${BACKUP_FILE}"
    echo "   Size: ${BACKUP_SIZE}"
    
    # Test backup integrity by checking if it contains expected content
    if grep -q "CREATE DATABASE" "${BACKUP_FILE}" && grep -q "PostgreSQL database dump" "${BACKUP_FILE}"; then
        echo "✅ Backup file integrity check passed"
    else
        echo "⚠️  Warning: Backup file may be incomplete"
        exit 1
    fi
else
    echo "❌ Backup failed!"
    exit 1
fi

echo ""
echo "🎉 Backup process completed!" 