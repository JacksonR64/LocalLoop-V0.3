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
        
        # Additional debugging for credentials
        log "INFO" "Project reference length: ${#SUPABASE_PROJECT_REF}"
        log "INFO" "Password length: ${#SUPABASE_DB_PASSWORD}"
        
        # Validate project reference format (should be alphanumeric)
        if [[ ! "${SUPABASE_PROJECT_REF}" =~ ^[a-zA-Z0-9]+$ ]]; then
            log "WARN" "Project reference contains non-alphanumeric characters: ${SUPABASE_PROJECT_REF}"
        fi
    else
        error_exit "Required environment variables not set: SUPABASE_DB_PASSWORD and SUPABASE_PROJECT_REF"
    fi
}

# Test database connection
test_db_connection() {
    log "INFO" "Testing database connection..."
    
    # First, verify psql is available
    if ! command -v psql &> /dev/null; then
        error_exit "psql command not found. PostgreSQL client tools not installed."
    fi
    
    log "INFO" "psql found: $(which psql)"
    log "INFO" "PostgreSQL version: $(psql --version)"
    
    # Show connection attempt (without password)
    local db_url_safe="${DB_URL//:${SUPABASE_DB_PASSWORD}@/:***@}"
    log "INFO" "Attempting connection to: ${db_url_safe}"
    
    # Test connection with a simple query (timeout after 30 seconds)
    log "INFO" "Running connection test with 30-second timeout..."
    if timeout 30 psql "${DB_URL}" -c "SELECT 1 as test;" 2>&1 | tee -a "${LOG_FILE}"; then
        log "INFO" "Database connection test successful"
    else
        local exit_code=$?
        log "ERROR" "Database connection test failed (exit code: ${exit_code})"
        log "ERROR" "Possible issues:"
        log "ERROR" "  - Wrong database password"
        log "ERROR" "  - Network connectivity issues from CI to Supabase"
        log "ERROR" "  - Incorrect project reference"
        log "ERROR" "  - Supabase service unavailable"
        log "ERROR" "  - Firewall blocking connections"
        
        # Try a basic network test
        log "INFO" "Testing network connectivity to Supabase..."
        if timeout 10 nc -zv aws-0-us-east-1.pooler.supabase.com 5432 2>&1 | tee -a "${LOG_FILE}"; then
            log "INFO" "Network connectivity to Supabase pooler successful"
        else
            log "ERROR" "Network connectivity to Supabase pooler failed"
        fi
        
        error_exit "Database connection test failed. Please check your credentials and network connectivity."
    fi
}

# Perform database backup
perform_backup() {
    log "INFO" "Starting database backup: ${BACKUP_NAME}"
    
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.sql"
    local backup_file_compressed="${backup_file}.gz"
    
    # Perform the backup with improved error handling
    log "INFO" "Running pg_dump (this may take several minutes for large databases)..."
    if timeout 1800 pg_dump "${DB_URL}" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=plain \
        --file="${backup_file}" 2>> "${LOG_FILE}"; then
        
        log "INFO" "Database backup completed successfully"
        
        # Check backup file size
        local file_size=$(du -h "${backup_file}" | cut -f1)
        log "INFO" "Backup file size: ${file_size}"
        
        # Compress the backup
        log "INFO" "Compressing backup file..."
        if gzip "${backup_file}"; then
            log "INFO" "Backup compressed: ${backup_file_compressed}"
            echo "${backup_file_compressed}"
        else
            log "WARN" "Failed to compress backup, keeping uncompressed version"
            echo "${backup_file}"
        fi
    else
        local exit_code=$?
        log "ERROR" "Database backup failed with exit code: ${exit_code}"
        
        # Provide specific error guidance
        if [[ ${exit_code} -eq 124 ]]; then
            log "ERROR" "Backup timed out after 30 minutes. Database may be too large or connection is slow."
        elif [[ ${exit_code} -eq 1 ]]; then
            log "ERROR" "pg_dump failed. Check database connection and permissions."
        fi
        
        # Clean up partial backup file
        if [[ -f "${backup_file}" ]]; then
            rm -f "${backup_file}"
            log "INFO" "Cleaned up partial backup file"
        fi
        
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
    
    test_db_connection
    
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