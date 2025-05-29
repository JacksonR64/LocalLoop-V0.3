import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createGoogleCalendarAuth } from '@/lib/google-auth'

/**
 * API Route: /api/auth/google/disconnect
 * Securely disconnects Google Calendar and removes stored tokens
 * 
 * Security:
 * - Requires user authentication
 * - Logs disconnection for audit purposes
 * - Completely removes encrypted tokens from database
 * - Provides confirmation of successful disconnection
 */

export async function POST() {
    try {
        // Create Supabase client and verify user authentication
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get Google Calendar auth service
        const googleAuth = createGoogleCalendarAuth()

        // Check current connection status before disconnecting
        const connectionStatus = await googleAuth.getConnectionStatus(user.id)

        if (!connectionStatus.connected) {
            return NextResponse.json(
                { message: 'Google Calendar was not connected' },
                { status: 200 }
            )
        }

        // Log the disconnection attempt for security audit
        console.log(`User ${user.id} initiating Google Calendar disconnection`, {
            userId: user.id,
            userEmail: user.email,
            connectedAt: connectionStatus.connectedAt,
            syncEnabled: connectionStatus.syncEnabled,
            timestamp: new Date().toISOString()
        })

        // Perform the disconnection
        await googleAuth.disconnectUserCalendar(user.id)

        // Verify disconnection was successful
        const verifyDisconnection = await googleAuth.getConnectionStatus(user.id)

        if (verifyDisconnection.connected) {
            console.error(`Failed to disconnect Google Calendar for user ${user.id}`)
            return NextResponse.json(
                { error: 'Failed to disconnect Google Calendar' },
                { status: 500 }
            )
        }

        // Log successful disconnection for security audit
        console.log(`Successfully disconnected Google Calendar for user ${user.id}`, {
            userId: user.id,
            userEmail: user.email,
            disconnectedAt: new Date().toISOString(),
            wasConnectedAt: connectionStatus.connectedAt
        })

        return NextResponse.json({
            success: true,
            message: 'Google Calendar disconnected successfully',
            disconnectedAt: new Date().toISOString()
        })

    } catch (error) {
        console.error('Error disconnecting Google Calendar:', error)
        return NextResponse.json(
            { error: 'Failed to disconnect Google Calendar' },
            { status: 500 }
        )
    }
}

/**
 * Handle other HTTP methods with appropriate error
 */
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST to disconnect.' },
        { status: 405 }
    )
}

export async function PUT() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST to disconnect.' },
        { status: 405 }
    )
}

export async function DELETE() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST to disconnect.' },
        { status: 405 }
    )
} 