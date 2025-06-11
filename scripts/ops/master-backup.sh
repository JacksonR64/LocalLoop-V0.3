#!/bin/bash

# LocalLoop Master Backup Script
# Orchestrates all backup types: database, configuration, and system backups
# Provides unified logging, reporting, and error handling

set -euo pipefail

# Configuration
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-./backups}"
LOG_FILE="${LOG_FILE:-./logs/master-backup.log}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MASTER_BACKUP_NAME="full_backup_${TIMESTAMP}"

# Backup types
DB_BACKUP_ENABLED="${DB_BACKUP_ENABLED:-true}"
CONFIG_BACKUP_ENABLED="${CONFIG_BACKUP_ENABLED:-true}"
GIT_BACKUP_ENABLED="${GIT_BACKUP_ENABLED:-true}"

# Email notifications
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"
SMTP_ENABLED="${SMTP_ENABLED:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Backup statistics
BACKUP_STATS=()

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
    send_notification "FAILED" "$1"
    exit 1
}

# Success notification
success_exit() {
    local message="$1"
    log "INFO" "$message"
    send_notification "SUCCESS" "$message"
    exit 0
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ "${SMTP_ENABLED}" == "true" && -n "${NOTIFICATION_EMAIL}" ]]; then
        local subject="LocalLoop Backup ${status} - $(date)"
        local body="Backup Status: ${status}\n\nMessage: ${message}\n\nTimestamp: $(date)"
        
        # Use mail command if available
        if command -v mail &> /dev/null; then
            echo -e "${body}" | mail -s "${subject}" "${NOTIFICATION_EMAIL}"
            log "INFO" "Notification sent to ${NOTIFICATION_EMAIL}"
        else
            log "WARN" "Mail command not available, skipping email notification"
        fi
    fi
}

# Setup directories
setup_directories() {
    log "INFO" "Setting up master backup directories..."
    
    mkdir -p "${BACKUP_BASE_DIR}/database"
    mkdir -p "${BACKUP_BASE_DIR}/config"
    mkdir -p "${BACKUP_BASE_DIR}/git"
    mkdir -p "${BACKUP_BASE_DIR}/reports"
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    log "INFO" "Backup base directory: ${BACKUP_BASE_DIR}"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking backup prerequisites..."
    
    # Check if backup scripts exist
    local script_dir="$(dirname "$0")"
    
    if [[ "${DB_BACKUP_ENABLED}" == "true" && ! -f "${script_dir}/database-backup.sh" ]]; then
        error_exit "Database backup script not found: ${script_dir}/database-backup.sh"
    fi
    
    if [[ "${CONFIG_BACKUP_ENABLED}" == "true" && ! -f "${script_dir}/config-backup.sh" ]]; then
        error_exit "Configuration backup script not found: ${script_dir}/config-backup.sh"
    fi
    
    # Check disk space (require at least 1GB free)
    local available_space=$(df "${BACKUP_BASE_DIR}" | awk 'NR==2 {print $4}')
    if [[ ${available_space} -lt 1048576 ]]; then
        error_exit "Insufficient disk space. At least 1GB required for backups"
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Database backup
perform_database_backup() {
    if [[ "${DB_BACKUP_ENABLED}" != "true" ]]; then
        log "INFO" "Database backup disabled, skipping..."
        return 0
    fi
    
    log "INFO" "Starting database backup..."
    local start_time=$(date +%s)
    
    local script_dir="$(dirname "$0")"
    if BACKUP_DIR="${BACKUP_BASE_DIR}/database" LOG_FILE="${LOG_FILE}" \
       SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF}" \
       SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD}" \
       SUPABASE_POOLER_HOST="${SUPABASE_POOLER_HOST}" \
       SUPABASE_POOLER_PORT="${SUPABASE_POOLER_PORT}" \
       bash "${script_dir}/database-backup.sh"; then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        BACKUP_STATS+=("Database backup: ✅ Success (${duration}s)")
        log "INFO" "Database backup completed successfully in ${duration}s"
        return 0
    else
        BACKUP_STATS+=("Database backup: ❌ Failed")
        error_exit "Database backup failed"
    fi
}

# Configuration backup
perform_config_backup() {
    if [[ "${CONFIG_BACKUP_ENABLED}" != "true" ]]; then
        log "INFO" "Configuration backup disabled, skipping..."
        return 0
    fi
    
    log "INFO" "Starting configuration backup..."
    local start_time=$(date +%s)
    
    local script_dir="$(dirname "$0")"
    if BACKUP_DIR="${BACKUP_BASE_DIR}/config" LOG_FILE="${LOG_FILE}" \
       bash "${script_dir}/config-backup.sh"; then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        BACKUP_STATS+=("Configuration backup: ✅ Success (${duration}s)")
        log "INFO" "Configuration backup completed successfully in ${duration}s"
        return 0
    else
        BACKUP_STATS+=("Configuration backup: ❌ Failed")
        error_exit "Configuration backup failed"
    fi
}

# Git repository backup
perform_git_backup() {
    if [[ "${GIT_BACKUP_ENABLED}" != "true" ]]; then
        log "INFO" "Git backup disabled, skipping..."
        return 0
    fi
    
    log "INFO" "Starting Git repository backup..."
    local start_time=$(date +%s)
    
    local git_backup_dir="${BACKUP_BASE_DIR}/git"
    local git_bundle="${git_backup_dir}/localloop_${TIMESTAMP}.bundle"
    
    mkdir -p "${git_backup_dir}"
    
    # Create Git bundle
    if git bundle create "${git_bundle}" --all 2>> "${LOG_FILE}"; then
        # Verify bundle integrity
        if git bundle verify "${git_bundle}" 2>> "${LOG_FILE}"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            local bundle_size=$(du -h "${git_bundle}" | cut -f1)
            BACKUP_STATS+=("Git backup: ✅ Success (${duration}s, ${bundle_size})")
            log "INFO" "Git backup completed successfully in ${duration}s (${bundle_size})"
            
            # Clean up old git bundles (keep last 5)
            find "${git_backup_dir}" -name "localloop_*.bundle" -type f | \
                sort -r | tail -n +6 | xargs -r rm -f
            
            return 0
        else
            BACKUP_STATS+=("Git backup: ❌ Bundle verification failed")
            error_exit "Git bundle verification failed"
        fi
    else
        BACKUP_STATS+=("Git backup: ❌ Bundle creation failed")
        error_exit "Git bundle creation failed"
    fi
}

# Generate comprehensive backup report
generate_backup_report() {
    log "INFO" "Generating backup report..."
    
    local report_file="${BACKUP_BASE_DIR}/reports/backup_report_${TIMESTAMP}.json"
    local report_md="${BACKUP_BASE_DIR}/reports/backup_report_${TIMESTAMP}.md"
    
    # Calculate total backup size
    local total_size=$(du -sh "${BACKUP_BASE_DIR}" 2>/dev/null | cut -f1 || echo "Unknown")
    
    # Create JSON report
    cat > "${report_file}" << EOF
{
  "backup_info": {
    "name": "${MASTER_BACKUP_NAME}",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "type": "full_system",
    "version": "1.0"
  },
  "environment": {
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "pwd": "$(pwd)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
  },
  "backup_components": {
    "database_enabled": ${DB_BACKUP_ENABLED},
    "configuration_enabled": ${CONFIG_BACKUP_ENABLED},
    "git_enabled": ${GIT_BACKUP_ENABLED}
  },
  "statistics": {
    "total_size": "${total_size}",
    "backup_count": $(find "${BACKUP_BASE_DIR}" -name "*backup_*" -type f -o -name "*backup_*" -type d | wc -l),
    "duration_seconds": $(($(date +%s) - ${BACKUP_START_TIME}))
  },
  "results": [
$(IFS=$'\n'; for stat in "${BACKUP_STATS[@]}"; do echo "    \"${stat}\","; done | sed '$s/,$//')
  ]
}
EOF
    
    # Create Markdown report
    cat > "${report_md}" << EOF
# LocalLoop Backup Report
**Generated:** $(date)  
**Backup Name:** ${MASTER_BACKUP_NAME}

## Backup Summary
- **Total Size:** ${total_size}
- **Duration:** $(($(date +%s) - ${BACKUP_START_TIME})) seconds
- **Components:** Database: ${DB_BACKUP_ENABLED}, Config: ${CONFIG_BACKUP_ENABLED}, Git: ${GIT_BACKUP_ENABLED}

## Backup Results
$(IFS=$'\n'; for stat in "${BACKUP_STATS[@]}"; do echo "- ${stat}"; done)

## Environment
- **Hostname:** $(hostname)
- **Git Commit:** $(git rev-parse HEAD 2>/dev/null || echo 'unknown')
- **Git Branch:** $(git branch --show-current 2>/dev/null || echo 'unknown')

## Files Created
\`\`\`
$(find "${BACKUP_BASE_DIR}" -name "*${TIMESTAMP}*" -type f 2>/dev/null | head -20)
\`\`\`

---
*Report generated by LocalLoop Master Backup Script*
EOF
    
    log "INFO" "Backup report created: $(basename "${report_file}")"
    echo "${report_file}"
}

# Verify backup integrity
verify_backup_integrity() {
    log "INFO" "Verifying backup integrity..."
    
    local verification_errors=0
    
    # Check database backup integrity
    if [[ "${DB_BACKUP_ENABLED}" == "true" ]]; then
        local latest_db_backup=$(find "${BACKUP_BASE_DIR}/database" -name "localloop_backup_*.sql*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        if [[ -n "${latest_db_backup}" && -f "${latest_db_backup}" ]]; then
            if [[ "${latest_db_backup}" == *.gz ]]; then
                if ! gzip -t "${latest_db_backup}" 2>/dev/null; then
                    log "ERROR" "Database backup file is corrupted: $(basename "${latest_db_backup}")"
                    ((verification_errors++))
                fi
            fi
        else
            log "ERROR" "No database backup file found"
            ((verification_errors++))
        fi
    fi
    
    # Check configuration backup integrity
    if [[ "${CONFIG_BACKUP_ENABLED}" == "true" ]]; then
        local latest_config_backup=$(find "${BACKUP_BASE_DIR}/config" -name "config_backup_*" -type d -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        if [[ -n "${latest_config_backup}" && -d "${latest_config_backup}" ]]; then
            if [[ $(find "${latest_config_backup}" -type f | wc -l) -eq 0 ]]; then
                log "ERROR" "Configuration backup directory is empty: $(basename "${latest_config_backup}")"
                ((verification_errors++))
            fi
        else
            log "ERROR" "No configuration backup directory found"
            ((verification_errors++))
        fi
    fi
    
    # Check git backup integrity
    if [[ "${GIT_BACKUP_ENABLED}" == "true" ]]; then
        local latest_git_backup=$(find "${BACKUP_BASE_DIR}/git" -name "localloop_*.bundle" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        if [[ -n "${latest_git_backup}" && -f "${latest_git_backup}" ]]; then
            if ! git bundle verify "${latest_git_backup}" &>/dev/null; then
                log "ERROR" "Git bundle is corrupted: $(basename "${latest_git_backup}")"
                ((verification_errors++))
            fi
        else
            log "ERROR" "No git bundle found"
            ((verification_errors++))
        fi
    fi
    
    if [[ ${verification_errors} -eq 0 ]]; then
        log "INFO" "Backup integrity verification passed"
        BACKUP_STATS+=("Integrity verification: ✅ Passed")
        return 0
    else
        log "ERROR" "Backup integrity verification failed with ${verification_errors} error(s)"
        BACKUP_STATS+=("Integrity verification: ❌ Failed (${verification_errors} errors)")
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up old backups..."
    
    local retention_days="${BACKUP_RETENTION_DAYS:-30}"
    local deleted_count=0
    
    # Find and delete old backup files/directories
    while IFS= read -r -d '' backup_item; do
        rm -rf "${backup_item}"
        ((deleted_count++))
        log "INFO" "Deleted old backup: $(basename "${backup_item}")"
    done < <(find "${BACKUP_BASE_DIR}" \( -name "*backup_*" -o -name "*.bundle" \) \( -type f -o -type d \) -mtime +${retention_days} -print0 2>/dev/null)
    
    if [[ ${deleted_count} -eq 0 ]]; then
        log "INFO" "No old backups to clean up"
    else
        log "INFO" "Cleaned up ${deleted_count} old backup(s)"
        BACKUP_STATS+=("Cleanup: ✅ Removed ${deleted_count} old backup(s)")
    fi
}

# Main execution
main() {
    local BACKUP_START_TIME=$(date +%s)
    
    log "INFO" "=== Starting LocalLoop Master Backup Process ==="
    log "INFO" "Backup name: ${MASTER_BACKUP_NAME}"
    log "INFO" "Components: Database=${DB_BACKUP_ENABLED}, Config=${CONFIG_BACKUP_ENABLED}, Git=${GIT_BACKUP_ENABLED}"
    
    # Setup and checks
    setup_directories
    check_prerequisites
    
    # Perform backups
    perform_database_backup
    perform_config_backup  
    perform_git_backup
    
    # Post-backup activities
    verify_backup_integrity
    cleanup_old_backups
    
    # Generate final report
    local report_file
    report_file=$(generate_backup_report)
    
    # Calculate total duration
    local total_duration=$(($(date +%s) - BACKUP_START_TIME))
    
    log "INFO" "=== LocalLoop Master Backup Process Completed ==="
    log "INFO" "Total duration: ${total_duration} seconds"
    log "INFO" "Report: $(basename "${report_file}")"
    log "INFO" "All backup components completed successfully"
    
    # Display summary
    echo -e "\n${GREEN}✅ BACKUP COMPLETED SUCCESSFULLY${NC}"
    echo -e "${BLUE}📊 Backup Summary:${NC}"
    for stat in "${BACKUP_STATS[@]}"; do
        echo -e "  ${stat}"
    done
    echo -e "${BLUE}📄 Report: $(basename "${report_file}")${NC}"
    echo -e "${BLUE}⏱️  Duration: ${total_duration} seconds${NC}"
    
    success_exit "Master backup completed successfully in ${total_duration} seconds"
}

# Handle script interruption
trap 'log "ERROR" "Master backup process interrupted"; exit 1' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 