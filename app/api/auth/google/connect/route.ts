import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createOAuthState } from '@/lib/google-auth'
import { createGoogleCalendarService } from '@/lib/google-calendar'

/**
 * API Route: /api/auth/google/connect
 * Initiates Google Calendar OAuth flow
 * 
 * Query Parameters:
 * - returnUrl (optional): URL to return to after OAuth completion
 * - action (optional): 'connect' | 'create_event' | 'sync' - OAuth action context
 * 
 * Security:
 * - Requires authenticated user
 * - CSRF protection via state parameter
 * - Validates user session before OAuth initiation
 */
export async function GET(request: NextRequest) {
    try {
        // Create Supabase client for server-side auth
        const supabase = await createServerSupabaseClient()

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required to connect Google Calendar' },
                { status: 401 }
            )
        }

        // Extract query parameters
        const { searchParams } = new URL(request.url)
        const returnUrl = searchParams.get('returnUrl') || '/dashboard'
        const action = searchParams.get('action') as 'connect' | 'create_event' | 'sync' || 'connect'

        // Generate secure OAuth state parameter (CSRF protection)
        const state = createOAuthState(user.id, returnUrl, action)

        // Create Google Calendar service instance
        const googleCalendarService = createGoogleCalendarService()

        // Generate OAuth authorization URL
        const authUrl = googleCalendarService.getAuthUrl(state)

        // Log OAuth initiation for debugging (remove in production)
        console.log(`OAuth initiated for user ${user.id}, action: ${action}, returnUrl: ${returnUrl}`)

        // Redirect user to Google OAuth consent screen
        return NextResponse.redirect(authUrl)

    } catch (error) {
        console.error('Error initiating Google OAuth flow:', error)

        return NextResponse.json(
            {
                error: 'Failed to initiate Google Calendar connection',
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined
            },
            { status: 500 }
        )
    }
}

/**
 * Handle other HTTP methods with appropriate error
 */
export async function POST() {
    return NextResponse.json(
        { error: 'Method not allowed. Use GET to initiate OAuth flow.' },
        { status: 405 }
    )
} 