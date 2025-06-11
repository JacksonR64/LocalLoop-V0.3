#!/usr/bin/env node

/**
 * Database Schema Test Script
 * Tests the LocalLoop database schema for syntax, consistency, and completeness
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
    console.log(`\n${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}${message}${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function success(message) {
    log(`${colors.green}✅ `, message);
}

function error(message) {
    log(`${colors.red}❌ `, message);
}

function warning(message) {
    log(`${colors.yellow}⚠️  `, message);
}

function info(message) {
    log(`${colors.blue}ℹ️  `, message);
}

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
    totalTests++;
    try {
        testFn();
        passedTests++;
        success(`${testName}`);
    } catch (err) {
        failedTests++;
        error(`${testName}: ${err.message}`);
    }
}

// File paths
const schemaFiles = {
    main: 'lib/database/schema.sql',
    types: 'lib/database/types.ts',
    migration: 'lib/database/migrations/001_initial_schema.sql',
    constraints: 'lib/database/additional_constraints.sql',
    computed: 'lib/database/computed_columns.sql',
    rls: 'lib/database/rls_policies.sql'
};

header('LocalLoop Database Schema Test Suite');

// Test 1: Check if all schema files exist
header('File Existence Tests');

Object.entries(schemaFiles).forEach(([name, filePath]) => {
    runTest(`${name} file exists`, () => {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File ${filePath} does not exist`);
        }
    });
});

// Test 2: Basic SQL syntax validation
header('SQL Syntax Validation');

function validateSQLSyntax(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip CREATE TABLE validation for constraint and computed column files
    const isMainSchemaFile = filePath.includes('schema.sql') || filePath.includes('migration');
    
    // Basic SQL syntax checks
    const checks = [
        {
            pattern: /;\s*$/gm,
            description: 'Statements end with semicolons'
        }
    ];
    
    // Only check for CREATE TABLE and PRIMARY KEY in main schema files
    if (isMainSchemaFile) {
        checks.push(
            {
                pattern: /CREATE TABLE\s+\w+\s*\(/g,
                description: 'Valid CREATE TABLE statements'
            },
            {
                pattern: /\bPRIMARY KEY\b/g,
                description: 'Contains PRIMARY KEY definitions'
            },
            {
                pattern: /\bREFERENCES\b/g,
                description: 'Contains foreign key references'
            }
        );
    }
    
    checks.forEach(check => {
        const matches = content.match(check.pattern);
        if (!matches || matches.length === 0) {
            throw new Error(`Missing ${check.description} in ${filePath}`);
        }
    });
    
    // Check for common SQL errors
    const errorPatterns = [
        {
            pattern: /CREATE TABLE\s+\w+\s*\(\s*\)/g,
            description: 'Empty table definitions'
        },
        {
            pattern: /,,/g,
            description: 'Double commas'
        }
    ];
    
    errorPatterns.forEach(check => {
        const matches = content.match(check.pattern);
        if (matches && matches.length > 0) {
            throw new Error(`Found ${check.description} in ${filePath}`);
        }
    });
}

[schemaFiles.main, schemaFiles.migration, schemaFiles.constraints, schemaFiles.computed].forEach(filePath => {
    runTest(`SQL syntax validation for ${path.basename(filePath)}`, () => {
        validateSQLSyntax(filePath);
    });
});

// Test 3: Table consistency checks
header('Schema Consistency Tests');

function extractTables(sqlContent) {
    const tableMatches = sqlContent.match(/CREATE TABLE\s+(\w+)/g);
    return tableMatches ? tableMatches.map(match => match.replace(/CREATE TABLE\s+/, '')) : [];
}

function extractColumns(sqlContent, tableName) {
    const tableRegex = new RegExp(`CREATE TABLE\\s+${tableName}\\s*\\(([^;]+)\\);`, 's');
    const match = sqlContent.match(tableRegex);
    if (!match) return [];
    
    const columnSection = match[1];
    const lines = columnSection.split('\n');
    const columns = [];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('CONSTRAINT') && !trimmed.startsWith('UNIQUE')) {
            const columnMatch = trimmed.match(/^(\w+)\s+/);
            if (columnMatch) {
                columns.push(columnMatch[1]);
            }
        }
    });
    
    return columns;
}

runTest('Main schema and migration consistency', () => {
    const mainContent = fs.readFileSync(schemaFiles.main, 'utf8');
    const migrationContent = fs.readFileSync(schemaFiles.migration, 'utf8');
    
    const mainTables = extractTables(mainContent);
    const migrationTables = extractTables(migrationContent);
    
    if (mainTables.length !== migrationTables.length) {
        throw new Error(`Table count mismatch: main (${mainTables.length}) vs migration (${migrationTables.length})`);
    }
    
    mainTables.forEach(table => {
        if (!migrationTables.includes(table)) {
            throw new Error(`Table ${table} exists in main schema but not in migration`);
        }
    });
});

// Test 4: Google Calendar integration requirements
header('Google Calendar Integration Tests');

runTest('Users table has Google Calendar OAuth fields', () => {
    const content = fs.readFileSync(schemaFiles.main, 'utf8');
    const requiredFields = [
        'google_calendar_access_token',
        'google_calendar_refresh_token',
        'google_calendar_token_expires_at',
        'google_calendar_connected'
    ];
    
    requiredFields.forEach(field => {
        if (!content.includes(field)) {
            throw new Error(`Missing required Google Calendar field: ${field}`);
        }
    });
});

runTest('Events table has Google Calendar template support', () => {
    const content = fs.readFileSync(schemaFiles.main, 'utf8');
    if (!content.includes('google_calendar_event_template')) {
        throw new Error('Missing google_calendar_event_template field in events table');
    }
});

runTest('RSVPs and Orders have Google Calendar tracking', () => {
    const content = fs.readFileSync(schemaFiles.main, 'utf8');
    const trackingFields = [
        'google_calendar_event_id',
        'added_to_google_calendar',
        'calendar_add_attempted_at',
        'calendar_add_error'
    ];
    
    ['rsvps', 'orders'].forEach(table => {
        trackingFields.forEach(field => {
            const tableContent = content.substring(
                content.indexOf(`CREATE TABLE ${table}`),
                content.indexOf('CREATE TABLE', content.indexOf(`CREATE TABLE ${table}`) + 1) || content.length
            );
            
            if (!tableContent.includes(field)) {
                throw new Error(`Missing ${field} in ${table} table`);
            }
        });
    });
});

// Test 5: TypeScript types consistency
header('TypeScript Types Tests');

runTest('TypeScript interfaces exist for all tables', () => {
    const content = fs.readFileSync(schemaFiles.types, 'utf8');
    const mainContent = fs.readFileSync(schemaFiles.main, 'utf8');
    const tables = extractTables(mainContent);
    
    const expectedInterfaces = tables.map(table => {
        // Special case handling for table names
        if (table === 'rsvps') return 'RSVP';
        if (table === 'ticket_types') return 'TicketType';
        // Convert 'users' to 'User', 'events' to 'Event', etc.
        return table.charAt(0).toUpperCase() + table.slice(1, -1);
    });
    
    expectedInterfaces.forEach(interfaceName => {
        if (!content.includes(`interface ${interfaceName}`)) {
            throw new Error(`Missing TypeScript interface: ${interfaceName}`);
        }
    });
});

runTest('Google Calendar types are defined', () => {
    const content = fs.readFileSync(schemaFiles.types, 'utf8');
    const requiredTypes = [
        'GoogleCalendarEventTemplate',
        'GoogleCalendarEvent',
        'CalendarIntegrationResult',
        'CalendarIntegrationStatus'
    ];
    
    requiredTypes.forEach(type => {
        if (!content.includes(type)) {
            throw new Error(`Missing Google Calendar type: ${type}`);
        }
    });
});

// Test 6: Computed columns validation
header('Computed Columns Tests');

runTest('Computed columns are properly defined', () => {
    const content = fs.readFileSync(schemaFiles.computed, 'utf8');
    const typesContent = fs.readFileSync(schemaFiles.types, 'utf8');
    
    // Check that computed columns mentioned in types.ts exist in computed_columns.sql
    const computedColumnPatterns = [
        'display_name_or_email',
        'has_valid_google_calendar',
        'rsvp_count',
        'spots_remaining',
        'is_full',
        'calendar_integration_status'
    ];
    
    computedColumnPatterns.forEach(column => {
        if (!content.includes(column)) {
            throw new Error(`Computed column ${column} not found in computed_columns.sql`);
        }
    });
});

// Test 7: Index validation
header('Database Index Tests');

runTest('Required indexes exist', () => {
    const content = fs.readFileSync(schemaFiles.main, 'utf8');
    const constraintsContent = fs.readFileSync(schemaFiles.constraints, 'utf8');
    const allContent = content + constraintsContent;
    
    const requiredIndexes = [
        'idx_events_start_time',
        'idx_events_category',
        'idx_rsvps_event_status',
        'idx_users_email',
        'idx_rsvps_calendar_integration',
        'idx_orders_calendar_integration'
    ];
    
    requiredIndexes.forEach(index => {
        if (!allContent.includes(index)) {
            throw new Error(`Required index ${index} not found`);
        }
    });
});

// Test 8: Constraint validation
header('Database Constraints Tests');

runTest('Business logic constraints exist', () => {
    const content = fs.readFileSync(schemaFiles.constraints, 'utf8');
    
    const requiredConstraints = [
        'check_event_time_logical',
        'check_online_event_url',
        'check_ticket_price_non_negative',
        'check_google_calendar_tokens_consistent',
        'check_rsvp_calendar_consistency'
    ];
    
    requiredConstraints.forEach(constraint => {
        if (!content.includes(constraint)) {
            throw new Error(`Required constraint ${constraint} not found`);
        }
    });
});

// Test 9: RLS Policy validation
header('Row-Level Security (RLS) Tests');

runTest('RLS policies are enabled on all tables', () => {
    const content = fs.readFileSync(schemaFiles.rls, 'utf8');
    
    const requiredTables = ['users', 'events', 'rsvps', 'orders', 'tickets', 'ticket_types'];
    
    requiredTables.forEach(table => {
        const rlsEnablePattern = new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i');
        if (!rlsEnablePattern.test(content)) {
            throw new Error(`RLS not enabled for table: ${table}`);
        }
    });
});

runTest('Required RLS policies exist', () => {
    const content = fs.readFileSync(schemaFiles.rls, 'utf8');
    
    const requiredPolicies = [
        'users_select_own',
        'users_update_own', 
        'events_select_published',
        'events_insert_organizer',
        'rsvps_select_own',
        'orders_select_own',
        'tickets_select_own',
        'ticket_types_select_public'
    ];
    
    requiredPolicies.forEach(policy => {
        if (!content.includes(`"${policy}"`)) {
            throw new Error(`Required RLS policy ${policy} not found`);
        }
    });
});

runTest('Admin and organizer policies exist', () => {
    const content = fs.readFileSync(schemaFiles.rls, 'utf8');
    
    const adminOrganizerPolicies = [
        'users_select_admin',
        'events_select_admin', 
        'rsvps_select_organizer',
        'orders_select_organizer',
        'tickets_update_organizer',
        'ticket_types_insert_organizer'
    ];
    
    adminOrganizerPolicies.forEach(policy => {
        if (!content.includes(`"${policy}"`)) {
            throw new Error(`Required admin/organizer policy ${policy} not found`);
        }
    });
});

runTest('Helper functions for RLS exist', () => {
    const content = fs.readFileSync(schemaFiles.rls, 'utf8');
    
    const helperFunctions = [
        'auth.is_event_organizer',
        'auth.is_admin',
        'auth.owns_guest_record'
    ];
    
    helperFunctions.forEach(func => {
        if (!content.includes(func)) {
            throw new Error(`Required RLS helper function ${func} not found`);
        }
    });
});

runTest('Guest user support in RLS policies', () => {
    const content = fs.readFileSync(schemaFiles.rls, 'utf8');
    
    // Check that guest support is implemented in RSVPs and Orders
    if (!content.includes('guest_email')) {
        throw new Error('Guest user support not implemented in RLS policies');
    }
    
    // Check for email matching logic
    if (!content.includes('guest_email = (')) {
        throw new Error('Guest email matching logic not found in RLS policies');
    }
});

// Final results
header('Test Results Summary');

if (failedTests === 0) {
    success(`All ${totalTests} tests passed! 🎉`);
    info('Database schema is ready for deployment.');
} else {
    error(`${failedTests} out of ${totalTests} tests failed.`);
    warning('Please fix the issues before proceeding.');
}

console.log(`\n${colors.bold}Test Summary:${colors.reset}`);
console.log(`  Total Tests: ${totalTests}`);
console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`);

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0); 