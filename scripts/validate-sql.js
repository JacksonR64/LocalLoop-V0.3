#!/usr/bin/env node

/**
 * PostgreSQL SQL Syntax Validator
 * Validates SQL files for PostgreSQL-specific syntax without requiring a database connection
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

console.log(`\n${colors.bold}${colors.blue}PostgreSQL SQL Syntax Validation${colors.reset}\n`);

const sqlFiles = [
    'lib/database/schema.sql',
    'lib/database/migrations/001_initial_schema.sql',
    'lib/database/additional_constraints.sql',
    'lib/database/computed_columns.sql'
];

let totalErrors = 0;

function validatePostgreSQLSyntax(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const errors = [];
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        
        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('--')) return;
        
        // Common PostgreSQL syntax errors
        const checks = [
            // Check for MySQL-specific syntax that shouldn't be in PostgreSQL
            {
                pattern: /AUTO_INCREMENT/i,
                error: 'MySQL AUTO_INCREMENT syntax detected. Use DEFAULT gen_random_uuid() or SERIAL in PostgreSQL'
            },
            {
                pattern: /ENGINE\s*=/i,
                error: 'MySQL ENGINE syntax detected. Not needed in PostgreSQL'
            },
            {
                pattern: /CHARSET\s*=/i,
                error: 'MySQL CHARSET syntax detected. Use ENCODING in PostgreSQL'
            },
            {
                pattern: /`/,
                error: 'MySQL backticks detected. Use double quotes or no quotes in PostgreSQL'
            },
            {
                pattern: /TINYINT|MEDIUMINT|LONGTEXT/i,
                error: 'MySQL-specific data type detected. Use PostgreSQL equivalents'
            },
            
            // Check for correct PostgreSQL UUID usage
            {
                pattern: /\buuid\s+PRIMARY KEY\b/i,
                validate: (line) => {
                    if (line.includes('DEFAULT gen_random_uuid()') || line.includes('DEFAULT uuid_generate_v4()')) {
                        return true;
                    }
                    return false;
                },
                error: 'UUID primary key should have DEFAULT gen_random_uuid() or uuid_generate_v4()'
            },
            
            // Check for proper timestamp usage
            {
                pattern: /timestamp(?!\s+with\s+time\s+zone)/i,
                error: 'Use "timestamp with time zone" instead of "timestamp" for better timezone handling'
            },
            
            // Check for proper JSONB usage
            {
                pattern: /\bjson\b/i,
                validate: (line) => {
                    if (line.includes('jsonb')) return true;
                    return !line.toLowerCase().includes('json ') && !line.toLowerCase().includes('json\t');
                },
                warning: 'Consider using JSONB instead of JSON for better performance'
            }
        ];
        
        checks.forEach(check => {
            if (check.pattern.test(trimmed)) {
                if (check.validate && check.validate(trimmed)) {
                    return; // Validation passed
                }
                
                if (check.warning) {
                    console.log(`  ${colors.yellow}⚠️  Line ${lineNum}: ${check.warning}${colors.reset}`);
                } else {
                    errors.push(`Line ${lineNum}: ${check.error}`);
                }
            }
        });
        
        // Check for unclosed parentheses in CREATE TABLE statements
        if (trimmed.includes('CREATE TABLE')) {
            const openParens = (trimmed.match(/\(/g) || []).length;
            const closeParens = (trimmed.match(/\)/g) || []).length;
            if (openParens > 0 && openParens !== closeParens) {
                // This is just the start of a multi-line CREATE TABLE, which is fine
            }
        }
        
        // Check for proper constraint naming
        if (trimmed.includes('CONSTRAINT') && !trimmed.includes('CONSTRAINT ') && !trimmed.includes('--')) {
            errors.push(`Line ${lineNum}: CONSTRAINT should be followed by a space and constraint name`);
        }
        
        // Check for proper index naming
        if (trimmed.includes('CREATE INDEX') && !trimmed.match(/CREATE INDEX\s+\w+/)) {
            errors.push(`Line ${lineNum}: CREATE INDEX should specify an index name`);
        }
    });
    
    return errors;
}

function validateSQLStructure(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    
    // Check for properly closed statements
    const statements = content.split(';').filter(stmt => stmt.trim());
    
    statements.forEach((statement, index) => {
        const trimmed = statement.trim();
        if (!trimmed) return;
        
        // Check for CREATE TABLE structure
        if (trimmed.includes('CREATE TABLE')) {
            const openParens = (trimmed.match(/\(/g) || []).length;
            const closeParens = (trimmed.match(/\)/g) || []).length;
            
            if (openParens === 0) {
                errors.push(`Statement ${index + 1}: CREATE TABLE missing opening parenthesis`);
            } else if (openParens !== closeParens) {
                errors.push(`Statement ${index + 1}: CREATE TABLE has mismatched parentheses (${openParens} open, ${closeParens} close)`);
            }
        }
        
        // Check for proper foreign key syntax
        if (trimmed.includes('REFERENCES')) {
            const referencesPattern = /REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/;
            const matches = trimmed.match(referencesPattern);
            if (!matches) {
                errors.push(`Statement ${index + 1}: REFERENCES syntax may be malformed`);
            }
        }
    });
    
    return errors;
}

// Run validation on all SQL files
sqlFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        error(`File not found: ${filePath}`);
        totalErrors++;
        return;
    }
    
    console.log(`\n${colors.bold}Validating: ${path.basename(filePath)}${colors.reset}`);
    
    // PostgreSQL-specific syntax validation
    const syntaxErrors = validatePostgreSQLSyntax(filePath);
    if (syntaxErrors.length > 0) {
        error(`PostgreSQL syntax issues in ${path.basename(filePath)}:`);
        syntaxErrors.forEach(err => {
            console.log(`    ${err}`);
        });
        totalErrors += syntaxErrors.length;
    } else {
        success(`PostgreSQL syntax validation passed`);
    }
    
    // SQL structure validation
    const structureErrors = validateSQLStructure(filePath);
    if (structureErrors.length > 0) {
        error(`SQL structure issues in ${path.basename(filePath)}:`);
        structureErrors.forEach(err => {
            console.log(`    ${err}`);
        });
        totalErrors += structureErrors.length;
    } else {
        success(`SQL structure validation passed`);
    }
});

// Summary
console.log(`\n${colors.bold}Validation Summary:${colors.reset}`);
if (totalErrors === 0) {
    success('All SQL files passed PostgreSQL validation! 🎉');
    info('Schema is ready for PostgreSQL deployment.');
} else {
    error(`Found ${totalErrors} validation issues that should be addressed.`);
}

console.log();
process.exit(totalErrors > 0 ? 1 : 0); 