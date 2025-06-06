#!/bin/bash

# LocalLoop Backup Cron Setup Script
# Configures automated local backup scheduling using cron jobs

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
CRON_USER="${CRON_USER:-$(whoami)}"
BACKUP_EMAIL="${BACKUP_EMAIL:-}"
LOG_FILE="${PROJECT_ROOT}/logs/cron-setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Print usage information
print_usage() {
    cat << EOF
LocalLoop Backup Cron Setup

USAGE:
    $0 [OPTIONS] ACTION

ACTIONS:
    install     - Install cron jobs for automated backups
    uninstall   - Remove all LocalLoop backup cron jobs
    status      - Show current cron job status
    test        - Test backup scripts without installing cron jobs

OPTIONS:
    -e, --email EMAIL       Email address for backup notifications
    -u, --user USER         User to run cron jobs as (default: current user)
    -h, --help              Show this help message

EXAMPLES:
    $0 install                                    # Install with default settings
    $0 install --email admin@localloop.com       # Install with email notifications
    $0 status                                     # Check current status
    $0 uninstall                                  # Remove all cron jobs

CRON SCHEDULE:
    - Daily database backup at 2:00 AM
    - Weekly full backup on Sundays at 3:00 AM
    - Monthly configuration backup on 1st at 4:00 AM
    - Backup cleanup runs daily at 5:00 AM

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--email)
                BACKUP_EMAIL="$2"
                shift 2
                ;;
            -u|--user)
                CRON_USER="$2"
                shift 2
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            install|uninstall|status|test)
                ACTION="$1"
                shift
                ;;
            *)
                echo "Unknown option: $1" >&2
                print_usage >&2
                exit 1
                ;;
        esac
    done
    
    if [[ -z "${ACTION:-}" ]]; then
        echo "Error: Action required" >&2
        print_usage >&2
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites for cron setup..."
    
    # Check if cron is available
    if ! command -v crontab &> /dev/null; then
        log "ERROR" "crontab command not found. Please install cron."
        exit 1
    fi
    
    # Check if backup scripts exist
    local required_scripts=("master-backup.sh" "database-backup.sh" "config-backup.sh")
    for script in "${required_scripts[@]}"; do
        if [[ ! -f "${SCRIPT_DIR}/${script}" ]]; then
            log "ERROR" "Required backup script not found: ${script}"
            exit 1
        fi
        
        if [[ ! -x "${SCRIPT_DIR}/${script}" ]]; then
            log "WARN" "Making backup script executable: ${script}"
            chmod +x "${SCRIPT_DIR}/${script}"
        fi
    done
    
    # Check if project directory is accessible
    if [[ ! -d "${PROJECT_ROOT}" ]]; then
        log "ERROR" "Project root directory not found: ${PROJECT_ROOT}"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p "${PROJECT_ROOT}/logs"
    mkdir -p "${PROJECT_ROOT}/backups"
    
    log "INFO" "Prerequisites check passed"
}

# Generate cron job entries
generate_cron_entries() {
    local master_script="${SCRIPT_DIR}/master-backup.sh"
    local project_root="${PROJECT_ROOT}"
    local log_dir="${PROJECT_ROOT}/logs"
    
    # Environment variables for cron
    local env_vars=""
    if [[ -n "${BACKUP_EMAIL}" ]]; then
        env_vars="NOTIFICATION_EMAIL=${BACKUP_EMAIL} SMTP_ENABLED=true"
    fi
    
    cat << EOF
# LocalLoop Automated Backup Jobs
# Generated on $(date) by $0
# Project: ${project_root}

# Set PATH and environment
PATH=/usr/local/bin:/usr/bin:/bin
SHELL=/bin/bash
${env_vars:+${env_vars}}

# Daily database backup at 2:00 AM
0 2 * * * cd "${project_root}" && DB_BACKUP_ENABLED=true CONFIG_BACKUP_ENABLED=false GIT_BACKUP_ENABLED=false "${master_script}" >> "${log_dir}/cron-daily.log" 2>&1

# Weekly full backup on Sundays at 3:00 AM
0 3 * * 0 cd "${project_root}" && "${master_script}" >> "${log_dir}/cron-weekly.log" 2>&1

# Monthly configuration backup on 1st at 4:00 AM
0 4 1 * * cd "${project_root}" && DB_BACKUP_ENABLED=false CONFIG_BACKUP_ENABLED=true GIT_BACKUP_ENABLED=true "${master_script}" >> "${log_dir}/cron-monthly.log" 2>&1

# Daily backup cleanup at 5:00 AM
0 5 * * * find "${project_root}/backups" -type f -mtime +30 -delete >> "${log_dir}/cron-cleanup.log" 2>&1

# Log rotation for backup logs (weekly)
0 6 * * 1 find "${log_dir}" -name "cron-*.log" -size +10M -exec truncate -s 1M {} \\; >> "${log_dir}/cron-maintenance.log" 2>&1

EOF
}

# Install cron jobs
install_cron_jobs() {
    log "INFO" "Installing LocalLoop backup cron jobs..."
    
    # Check if cron jobs already exist
    if crontab -l 2>/dev/null | grep -q "LocalLoop Automated Backup Jobs"; then
        log "WARN" "LocalLoop backup cron jobs already exist"
        echo -e "${YELLOW}Existing cron jobs found. Do you want to replace them? [y/N]${NC}"
        read -r response
        if [[ ! "${response}" =~ ^[Yy]$ ]]; then
            log "INFO" "Installation cancelled by user"
            exit 0
        fi
        
        # Remove existing LocalLoop cron jobs
        uninstall_cron_jobs
    fi
    
    # Generate new cron entries
    local temp_cron=$(mktemp)
    
    # Preserve existing cron jobs
    crontab -l 2>/dev/null > "${temp_cron}" || true
    
    # Add LocalLoop backup jobs
    echo "" >> "${temp_cron}"
    generate_cron_entries >> "${temp_cron}"
    
    # Install new crontab
    if crontab "${temp_cron}"; then
        log "INFO" "Cron jobs installed successfully"
        rm -f "${temp_cron}"
        
        # Display installed jobs
        echo -e "\n${GREEN}✅ Installed Backup Schedule:${NC}"
        echo -e "${BLUE}• Daily database backup: 2:00 AM${NC}"
        echo -e "${BLUE}• Weekly full backup: Sundays 3:00 AM${NC}"
        echo -e "${BLUE}• Monthly config backup: 1st of month 4:00 AM${NC}"
        echo -e "${BLUE}• Daily cleanup: 5:00 AM${NC}"
        
        if [[ -n "${BACKUP_EMAIL}" ]]; then
            echo -e "${BLUE}• Email notifications: ${BACKUP_EMAIL}${NC}"
        fi
        
        # Test backup scripts
        log "INFO" "Testing backup scripts..."
        if test_backup_scripts; then
            echo -e "${GREEN}✅ Backup scripts test passed${NC}"
        else
            echo -e "${YELLOW}⚠️ Backup scripts test had warnings (check logs)${NC}"
        fi
        
    else
        log "ERROR" "Failed to install cron jobs"
        rm -f "${temp_cron}"
        exit 1
    fi
}

# Uninstall cron jobs
uninstall_cron_jobs() {
    log "INFO" "Removing LocalLoop backup cron jobs..."
    
    # Get current crontab
    local temp_cron=$(mktemp)
    if ! crontab -l 2>/dev/null > "${temp_cron}"; then
        log "INFO" "No existing crontab found"
        rm -f "${temp_cron}"
        return 0
    fi
    
    # Remove LocalLoop backup sections
    if grep -q "LocalLoop Automated Backup Jobs" "${temp_cron}"; then
        # Remove from start marker to end of file or next non-LocalLoop entry
        sed -i '/# LocalLoop Automated Backup Jobs/,/^[^#]/{ /^[^#]/!d; }' "${temp_cron}"
        sed -i '/# LocalLoop Automated Backup Jobs/d' "${temp_cron}"
        
        # Install cleaned crontab
        if crontab "${temp_cron}"; then
            log "INFO" "LocalLoop backup cron jobs removed successfully"
            echo -e "${GREEN}✅ LocalLoop backup cron jobs uninstalled${NC}"
        else
            log "ERROR" "Failed to update crontab"
            exit 1
        fi
    else
        log "INFO" "No LocalLoop backup cron jobs found to remove"
        echo -e "${YELLOW}ℹ️ No LocalLoop backup cron jobs found${NC}"
    fi
    
    rm -f "${temp_cron}"
}

# Show current cron job status
show_cron_status() {
    log "INFO" "Checking LocalLoop backup cron job status..."
    
    echo -e "${BLUE}📋 Current Cron Jobs for user: ${CRON_USER}${NC}"
    echo ""
    
    if crontab -l 2>/dev/null | grep -A 20 "LocalLoop Automated Backup Jobs"; then
        echo ""
        echo -e "${GREEN}✅ LocalLoop backup cron jobs are installed${NC}"
        
        # Check recent log files
        if [[ -d "${PROJECT_ROOT}/logs" ]]; then
            echo ""
            echo -e "${BLUE}📄 Recent Backup Logs:${NC}"
            find "${PROJECT_ROOT}/logs" -name "cron-*.log" -type f -mtime -7 -exec ls -la {} \; 2>/dev/null || echo "No recent backup logs found"
        fi
        
        # Check last backup status
        if [[ -d "${PROJECT_ROOT}/backups" ]]; then
            echo ""
            echo -e "${BLUE}💾 Recent Backups:${NC}"
            find "${PROJECT_ROOT}/backups" -type f -mtime -7 -exec ls -lah {} \; 2>/dev/null | head -10 || echo "No recent backups found"
        fi
        
    else
        echo -e "${YELLOW}⚠️ No LocalLoop backup cron jobs found${NC}"
        echo "Use '$0 install' to set up automated backups"
    fi
}

# Test backup scripts without installing cron
test_backup_scripts() {
    log "INFO" "Testing backup scripts..."
    
    local test_passed=true
    local test_backup_dir="${PROJECT_ROOT}/backups/test"
    mkdir -p "${test_backup_dir}"
    
    echo -e "${BLUE}🧪 Testing backup scripts...${NC}"
    
    # Test configuration backup (safest to test)
    echo "Testing configuration backup..."
    if BACKUP_DIR="${test_backup_dir}" \
       CONFIG_BACKUP_ENABLED=true \
       DB_BACKUP_ENABLED=false \
       GIT_BACKUP_ENABLED=false \
       "${SCRIPT_DIR}/master-backup.sh" &>/dev/null; then
        echo -e "  ✅ Configuration backup test: ${GREEN}PASSED${NC}"
    else
        echo -e "  ❌ Configuration backup test: ${RED}FAILED${NC}"
        test_passed=false
    fi
    
    # Test Git backup
    echo "Testing Git backup..."
    if BACKUP_DIR="${test_backup_dir}" \
       CONFIG_BACKUP_ENABLED=false \
       DB_BACKUP_ENABLED=false \
       GIT_BACKUP_ENABLED=true \
       "${SCRIPT_DIR}/master-backup.sh" &>/dev/null; then
        echo -e "  ✅ Git backup test: ${GREEN}PASSED${NC}"
    else
        echo -e "  ❌ Git backup test: ${RED}FAILED${NC}"
        test_passed=false
    fi
    
    # Clean up test files
    rm -rf "${test_backup_dir}"
    
    if [[ "${test_passed}" == "true" ]]; then
        echo -e "${GREEN}✅ All backup script tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Some backup script tests failed${NC}"
        return 1
    fi
}

# Main execution
main() {
    # Setup logging
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    log "INFO" "=== LocalLoop Backup Cron Setup Started ==="
    log "INFO" "Action: ${ACTION}"
    log "INFO" "User: ${CRON_USER}"
    log "INFO" "Project root: ${PROJECT_ROOT}"
    
    case "${ACTION}" in
        install)
            check_prerequisites
            install_cron_jobs
            ;;
        uninstall)
            uninstall_cron_jobs
            ;;
        status)
            show_cron_status
            ;;
        test)
            check_prerequisites
            test_backup_scripts
            ;;
        *)
            log "ERROR" "Unknown action: ${ACTION}"
            print_usage >&2
            exit 1
            ;;
    esac
    
    log "INFO" "=== LocalLoop Backup Cron Setup Completed ==="
}

# Parse arguments and run main function
ACTION=""
parse_arguments "$@"
main 