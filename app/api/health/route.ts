import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Health Check Endpoint
 * 
 * Provides comprehensive system health verification for deployment validation.
 * Returns JSON response with status of critical services and components.
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        version: {
            build: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
            ref: process.env.VERCEL_GIT_COMMIT_REF || 'unknown'
        },
        services: {
            app: {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            database: {
                status: 'unknown',
                connected: false,
                responseTime: null as number | null
            }
        },
        checks: [] as Array<{ name: string; status: 'pass' | 'fail'; message?: string }>
    };

    // Database connectivity check
    try {
        const dbStartTime = Date.now();
        const supabase = await createServerSupabaseClient();

        // Simple connectivity test
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1)
            .maybeSingle();

        const dbResponseTime = Date.now() - dbStartTime;

        if (error) {
            healthCheck.services.database = {
                status: 'unhealthy',
                connected: false,
                responseTime: dbResponseTime
            };
            healthCheck.checks.push({
                name: 'database_connectivity',
                status: 'fail',
                message: `Database query failed: ${error.message}`
            });
            healthCheck.status = 'degraded';
        } else {
            healthCheck.services.database = {
                status: 'healthy',
                connected: true,
                responseTime: dbResponseTime
            };
            healthCheck.checks.push({
                name: 'database_connectivity',
                status: 'pass'
            });
        }
    } catch (error) {
        healthCheck.services.database = {
            status: 'unhealthy',
            connected: false,
            responseTime: null
        };
        healthCheck.checks.push({
            name: 'database_connectivity',
            status: 'fail',
            message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        healthCheck.status = 'unhealthy';
    }

    // Environment validation checks
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
        healthCheck.checks.push({
            name: 'environment_variables',
            status: 'fail',
            message: `Missing required environment variables: ${missingEnvVars.join(', ')}`
        });
        healthCheck.status = 'unhealthy';
    } else {
        healthCheck.checks.push({
            name: 'environment_variables',
            status: 'pass'
        });
    }

    // Calculate total response time
    const totalResponseTime = Date.now() - startTime;

    // Add response time to health check
    (healthCheck as any).responseTime = totalResponseTime;

    // Determine HTTP status code based on health
    let statusCode = 200;
    if (healthCheck.status === 'degraded') {
        statusCode = 200; // Still operational but with issues
    } else if (healthCheck.status === 'unhealthy') {
        statusCode = 503; // Service unavailable
    }

    return NextResponse.json(healthCheck, {
        status: statusCode,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
}

/**
 * Handle POST requests for more detailed health checks
 */
export async function POST(request: NextRequest) {
    // Future: Add more detailed health checks if needed
    return GET(request);
} 