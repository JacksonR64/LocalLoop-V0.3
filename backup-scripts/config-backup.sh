#!/bin/bash

# LocalLoop Configuration Backup Script
# Backs up deployment configurations, environment templates, and project settings
# WITHOUT exposing sensitive secrets

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/config}"
LOG_FILE="${LOG_FILE:-./logs/backup.log}"
RETENTION_DAYS="${RETENTION_DAYS:-90}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="config_backup_${TIMESTAMP}"

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

# Setup backup directories
setup_directories() {
    log "INFO" "Setting up configuration backup directories..."
    
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    log "INFO" "Config backup directory: ${BACKUP_DIR}"
}

# Create environment template (without secrets)
backup_env_template() {
    log "INFO" "Creating environment template backup..."
    
    local env_template="${BACKUP_DIR}/${BACKUP_NAME}_env_template.txt"
    
    cat > "${env_template}" << 'EOF'
# LocalLoop Production Environment Variables Template
# Generated on: $(date)
# 
# SECURITY NOTE: This template contains variable names and descriptions only.
# Actual secret values are NOT included for security reasons.
# Use this template to set up environment variables in new deployments.

# === CORE APPLICATION ===
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=LocalLoop

# === SUPABASE CONFIGURATION ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_ACCESS_TOKEN=your_access_token_here
SUPABASE_DB_PASSWORD=your_db_password_here

# === GOOGLE OAUTH & CALENDAR ===
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# === STRIPE PAYMENTS ===
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# === EMAIL SERVICE (RESEND) ===
RESEND_API_KEY=re_your_resend_api_key

# === SECURITY ===
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com

# === MONITORING & ANALYTICS ===
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# === DEVELOPMENT/TESTING ===
NODE_ENV=production
VERCEL_ENV=production
EOF
    
    # Replace the date placeholder
    sed -i.bak "s/\$(date)/$(date)/" "${env_template}" && rm "${env_template}.bak"
    
    log "INFO" "Environment template created: $(basename "${env_template}")"
    echo "${env_template}"
}

# Backup deployment configuration files
backup_deployment_configs() {
    log "INFO" "Backing up deployment configuration files..."
    
    local config_dir="${BACKUP_DIR}/${BACKUP_NAME}_configs"
    mkdir -p "${config_dir}"
    
    # List of configuration files to backup
    local config_files=(
        "vercel.json"
        "next.config.ts"
        "package.json"
        "package-lock.json"
        "tsconfig.json"
        "tailwind.config.ts"
        "postcss.config.mjs"
        "eslint.config.mjs"
        "playwright.config.ts"
        "jest.config.js"
        "commitlint.config.js"
        "lighthouserc.js"
        "middleware.ts"
        ".gitignore"
        "README.md"
        "DEPLOYMENT.md"
        "TESTING-GUIDE.md"
    )
    
    local backed_up_count=0
    for file in "${config_files[@]}"; do
        if [[ -f "${file}" ]]; then
            cp "${file}" "${config_dir}/"
            log "INFO" "Backed up: ${file}"
            ((backed_up_count++))
        else
            log "WARN" "Configuration file not found: ${file}"
        fi
    done
    
    # Backup docs directory if it exists
    if [[ -d "docs" ]]; then
        cp -r "docs" "${config_dir}/"
        log "INFO" "Backed up: docs/ directory"
        ((backed_up_count++))
    fi
    
    # Backup scripts directory (excluding sensitive files)
    if [[ -d "scripts" ]]; then
        mkdir -p "${config_dir}/scripts"
        find scripts -name "*.sh" -o -name "*.js" -o -name "*.md" -o -name "*.json" | while read -r script_file; do
            # Skip files that might contain secrets
            if [[ ! "${script_file}" =~ (secret|key|token|password) ]]; then
                cp "${script_file}" "${config_dir}/scripts/"
                log "INFO" "Backed up: ${script_file}"
            fi
        done
        ((backed_up_count++))
    fi
    
    log "INFO" "Configuration backup completed. Files backed up: ${backed_up_count}"
    echo "${config_dir}"
}

# Create deployment checklist backup
backup_deployment_checklist() {
    log "INFO" "Creating deployment checklist backup..."
    
    local checklist_file="${BACKUP_DIR}/${BACKUP_NAME}_deployment_checklist.md"
    
    cat > "${checklist_file}" << 'EOF'
# LocalLoop Deployment Checklist
*Generated on: $(date)*

## Pre-Deployment Checklist

### Environment Setup
- [ ] All environment variables configured in production
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] CDN configured (if applicable)

### Security Verification
- [ ] All secrets properly configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS settings verified
- [ ] Rate limiting configured

### Performance Verification
- [ ] Build optimization verified
- [ ] Image optimization configured
- [ ] Caching strategies implemented
- [ ] Database indexes optimized
- [ ] CDN configured for static assets

### Monitoring Setup
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Log aggregation setup
- [ ] Backup monitoring active

### Testing Verification
- [ ] All tests passing
- [ ] E2E tests completed
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Accessibility testing completed

## Post-Deployment Checklist

### Immediate Verification (0-30 minutes)
- [ ] Application loads successfully
- [ ] User authentication working
- [ ] Database connections active
- [ ] Payment processing functional
- [ ] Email notifications working
- [ ] Google Calendar integration working

### Extended Verification (1-24 hours)
- [ ] Performance metrics within acceptable ranges
- [ ] Error rates below threshold
- [ ] Backup processes running
- [ ] Monitoring alerts configured
- [ ] User feedback collected

### Long-term Monitoring (1-7 days)
- [ ] System stability confirmed
- [ ] Performance trends analyzed
- [ ] User adoption metrics reviewed
- [ ] Support ticket volume normal
- [ ] Backup integrity verified

## Rollback Plan

### Immediate Rollback (< 5 minutes)
1. Revert to previous Vercel deployment
2. Verify application functionality
3. Notify stakeholders

### Database Rollback (if needed)
1. Stop application traffic
2. Restore database from backup
3. Verify data integrity
4. Resume application traffic

### Communication Plan
- [ ] Stakeholder notification prepared
- [ ] User communication template ready
- [ ] Status page updates planned
- [ ] Support team briefed

## Emergency Contacts
- Technical Lead: [Contact Info]
- DevOps Engineer: [Contact Info]
- Product Manager: [Contact Info]
- Support Team: [Contact Info]

## Recovery Procedures
- Database Recovery: See docs/BACKUP_STRATEGY.md
- Configuration Recovery: See backup-scripts/config-backup.sh
- Full System Recovery: See docs/DISASTER_RECOVERY.md
EOF
    
    # Replace the date placeholder
    sed -i.bak "s/\$(date)/$(date)/" "${checklist_file}" && rm "${checklist_file}.bak"
    
    log "INFO" "Deployment checklist created: $(basename "${checklist_file}")"
    echo "${checklist_file}"
}

# Create backup manifest
create_backup_manifest() {
    local env_template="$1"
    local config_dir="$2"
    local checklist_file="$3"
    
    log "INFO" "Creating backup manifest..."
    
    local manifest_file="${BACKUP_DIR}/${BACKUP_NAME}_manifest.json"
    
    cat > "${manifest_file}" << EOF
{
  "backup_info": {
    "name": "${BACKUP_NAME}",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "type": "configuration",
    "version": "1.0"
  },
  "contents": {
    "environment_template": "$(basename "${env_template}")",
    "configuration_files": "$(basename "${config_dir}")",
    "deployment_checklist": "$(basename "${checklist_file}")"
  },
  "metadata": {
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "node_version": "$(node --version 2>/dev/null || echo 'unknown')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'unknown')"
  },
  "verification": {
    "file_count": $(find "${BACKUP_DIR}" -name "${BACKUP_NAME}*" | wc -l),
    "total_size": "$(du -sh "${BACKUP_DIR}" | cut -f1)"
  }
}
EOF
    
    log "INFO" "Backup manifest created: $(basename "${manifest_file}")"
    echo "${manifest_file}"
}

# Clean up old configuration backups
cleanup_old_backups() {
    log "INFO" "Cleaning up configuration backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -rf "${file}"
        ((deleted_count++))
        log "INFO" "Deleted old backup: $(basename "${file}")"
    done < <(find "${BACKUP_DIR}" -name "config_backup_*" -type f -o -name "config_backup_*" -type d -mtime +${RETENTION_DAYS} -print0 2>/dev/null)
    
    if [[ ${deleted_count} -eq 0 ]]; then
        log "INFO" "No old configuration backups to clean up"
    else
        log "INFO" "Cleaned up ${deleted_count} old configuration backup(s)"
    fi
}

# Generate backup report
generate_report() {
    local manifest_file="$1"
    local backup_count=$(find "${BACKUP_DIR}" -name "config_backup_*" | wc -l)
    local total_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
    
    log "INFO" "=== CONFIGURATION BACKUP REPORT ==="
    log "INFO" "Backup name: ${BACKUP_NAME}"
    log "INFO" "Manifest file: $(basename "${manifest_file}")"
    log "INFO" "Total size: ${total_size}"
    log "INFO" "Total config backups: ${backup_count}"
    log "INFO" "Retention period: ${RETENTION_DAYS} days"
    log "INFO" "=================================="
}

# Main execution
main() {
    log "INFO" "Starting LocalLoop configuration backup process..."
    
    setup_directories
    
    # Perform backups
    local env_template
    env_template=$(backup_env_template)
    
    local config_dir
    config_dir=$(backup_deployment_configs)
    
    local checklist_file
    checklist_file=$(backup_deployment_checklist)
    
    # Create manifest and cleanup
    local manifest_file
    manifest_file=$(create_backup_manifest "${env_template}" "${config_dir}" "${checklist_file}")
    
    cleanup_old_backups
    generate_report "${manifest_file}"
    
    log "INFO" "Configuration backup process completed successfully"
    echo -e "${GREEN}✅ Configuration backup completed: ${BACKUP_NAME}${NC}"
}

# Handle script interruption
trap 'log "ERROR" "Configuration backup process interrupted"; exit 1' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 