#!/bin/bash

# LocalLoop Database Backup Script
# Performs automated backup of Supabase database with verification and logging

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
LOG_FILE="${LOG_FILE:-./logs/backup.log}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="localloop_backup_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if required environment variables are set
    if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
        error_exit "SUPABASE_PROJECT_REF environment variable is not set"
    fi
    
    if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
        error_exit "SUPABASE_ACCESS_TOKEN environment variable is not set"
    fi
    
    # Note: We no longer require Supabase CLI - using direct PostgreSQL connection
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        error_exit "pg_dump is not available. Install PostgreSQL client tools."
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Create backup directories
setup_directories() {
    log "INFO" "Setting up backup directories..."
    
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    log "INFO" "Backup directory: ${BACKUP_DIR}"
    log "INFO" "Log file: ${LOG_FILE}"
}

# Get database connection details from environment variables
get_db_connection() {
    log "INFO" "Configuring database connection..."
    
    # Construct database URL using Supabase pooler (better for CI environments)
    # Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
    if [[ -n "${SUPABASE_DB_PASSWORD:-}" && -n "${SUPABASE_PROJECT_REF:-}" ]]; then
        DB_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
        log "INFO" "Database connection configured successfully (using pooler)"
    else
        error_exit "Required environment variables not set: SUPABASE_DB_PASSWORD and SUPABASE_PROJECT_REF"
    fi
}

# Perform database backup
perform_backup() {
    log "INFO" "Starting database backup: ${BACKUP_NAME}"
    
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.sql"
    local backup_file_compressed="${backup_file}.gz"
    
    # Perform the backup
    if pg_dump "${DB_URL}" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=plain \
        --file="${backup_file}" 2>> "${LOG_FILE}"; then
        
        log "INFO" "Database backup completed successfully"
        
        # Compress the backup
        if gzip "${backup_file}"; then
            log "INFO" "Backup compressed: ${backup_file_compressed}"
            echo "${backup_file_compressed}"
        else
            log "WARN" "Failed to compress backup, keeping uncompressed version"
            echo "${backup_file}"
        fi
    else
        error_exit "Database backup failed"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    log "INFO" "Verifying backup integrity..."
    
    # Check if file exists and is not empty
    if [[ ! -f "${backup_file}" ]] || [[ ! -s "${backup_file}" ]]; then
        error_exit "Backup file is missing or empty: ${backup_file}"
    fi
    
    # Check if compressed file can be read
    if [[ "${backup_file}" == *.gz ]]; then
        if ! gzip -t "${backup_file}" 2>/dev/null; then
            error_exit "Backup file is corrupted: ${backup_file}"
        fi
    fi
    
    # Get file size
    local file_size=$(du -h "${backup_file}" | cut -f1)
    log "INFO" "Backup verification passed. File size: ${file_size}"
}

# Clean up old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "${file}"
        ((deleted_count++))
        log "INFO" "Deleted old backup: $(basename "${file}")"
    done < <(find "${BACKUP_DIR}" -name "localloop_backup_*.sql*" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)
    
    if [[ ${deleted_count} -eq 0 ]]; then
        log "INFO" "No old backups to clean up"
    else
        log "INFO" "Cleaned up ${deleted_count} old backup(s)"
    fi
}

# Generate backup report
generate_report() {
    local backup_file="$1"
    local file_size=$(du -h "${backup_file}" | cut -f1)
    local backup_count=$(find "${BACKUP_DIR}" -name "localloop_backup_*.sql*" -type f | wc -l)
    
    log "INFO" "=== BACKUP REPORT ==="
    log "INFO" "Backup file: $(basename "${backup_file}")"
    log "INFO" "File size: ${file_size}"
    log "INFO" "Total backups: ${backup_count}"
    log "INFO" "Retention period: ${RETENTION_DAYS} days"
    log "INFO" "===================="
}

# Main execution
main() {
    log "INFO" "Starting LocalLoop database backup process..."
    
    check_prerequisites
    setup_directories
    get_db_connection
    
    local backup_file
    backup_file=$(perform_backup)
    
    verify_backup "${backup_file}"
    cleanup_old_backups
    generate_report "${backup_file}"
    
    log "INFO" "Database backup process completed successfully"
    echo -e "${GREEN}✅ Backup completed: $(basename "${backup_file}")${NC}"
}

# Handle script interruption
trap 'log "ERROR" "Backup process interrupted"; exit 1' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 