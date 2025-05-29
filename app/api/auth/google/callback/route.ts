import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
    createGoogleCalendarAuth,
    parseOAuthState,
} from '@/lib/google-auth'
import { createGoogleCalendarService, GoogleCalendarTokens } from '@/lib/google-calendar'

/**
 * API Route: /api/auth/google/callback
 * Handles Google OAuth callback and token exchange
 * 
 * Query Parameters:
 * - code: Authorization code from Google OAuth flow
 * - state: CSRF protection state parameter (base64 encoded)
 * - error: OAuth error (if authorization was denied)
 * 
 * Security:
 * - Validates state parameter for CSRF protection
 * - Requires valid authorization code
 * - Encrypts tokens before storage
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // Handle OAuth authorization denied
        if (error) {
            console.log(`OAuth authorization denied: ${error}`)
            const redirectUrl = new URL('/auth/google/callback', request.url)
            redirectUrl.searchParams.set('error', 'access_denied')
            redirectUrl.searchParams.set('message', 'Google Calendar access was denied')
            return NextResponse.redirect(redirectUrl)
        }

        // Validate required parameters
        if (!code || !state) {
            console.error('Missing required OAuth parameters:', { code: !!code, state: !!state })
            const redirectUrl = new URL('/auth/google/callback', request.url)
            redirectUrl.searchParams.set('error', 'invalid_request')
            redirectUrl.searchParams.set('message', 'Invalid OAuth callback parameters')
            return NextResponse.redirect(redirectUrl)
        }

        // Parse and validate OAuth state parameter (CSRF protection)
        let oAuthState
        try {
            oAuthState = parseOAuthState(state)
        } catch (stateError) {
            console.error('Invalid OAuth state parameter:', stateError)
            const redirectUrl = new URL('/auth/google/callback', request.url)
            redirectUrl.searchParams.set('error', 'invalid_state')
            redirectUrl.searchParams.set('message', 'Invalid security token')
            return NextResponse.redirect(redirectUrl)
        }

        // Create Supabase client and verify user authentication
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('User authentication failed during OAuth callback:', authError)
            const redirectUrl = new URL('/auth/login', request.url)
            redirectUrl.searchParams.set('message', 'Authentication required')
            return NextResponse.redirect(redirectUrl)
        }

        // Verify state matches current user (additional security check)
        if (oAuthState.userId !== user.id) {
            console.error('OAuth state user ID mismatch:', {
                stateUserId: oAuthState.userId,
                currentUserId: user.id
            })
            const redirectUrl = new URL('/auth/google/callback', request.url)
            redirectUrl.searchParams.set('error', 'user_mismatch')
            redirectUrl.searchParams.set('message', 'Security validation failed')
            return NextResponse.redirect(redirectUrl)
        }

        // Exchange authorization code for access tokens
        const googleCalendarService = createGoogleCalendarService()
        let tokens
        try {
            tokens = await googleCalendarService.getTokensFromCode(code)
        } catch (tokenError) {
            console.error('Failed to exchange code for tokens:', tokenError)
            const redirectUrl = new URL('/auth/google/callback', request.url)
            redirectUrl.searchParams.set('error', 'token_exchange_failed')
            redirectUrl.searchParams.set('message', 'Failed to obtain Google Calendar access')
            return NextResponse.redirect(redirectUrl)
        }

        // Store encrypted tokens in Supabase
        const storeResult = await storeCalendarTokens(user.id, tokens)
        if (!storeResult.success) {
            console.error('Failed to store calendar tokens:', storeResult.error)
            const redirectUrl = new URL('/auth/google/callback', request.url)
            redirectUrl.searchParams.set('error', 'storage_failed')
            redirectUrl.searchParams.set('message', 'Failed to save Google Calendar connection')
            return NextResponse.redirect(redirectUrl)
        }

        // Test calendar connection to ensure everything works
        const connectionTest = await testCalendarConnection(user.id)
        if (!connectionTest.connected) {
            console.warn('Calendar connection test failed, but tokens stored:', connectionTest.error)
            // Continue anyway - the test might fail due to API quota or temporary issues
        }

        // Log successful OAuth completion
        console.log(`OAuth completed successfully for user ${user.id}, action: ${oAuthState.action}`)

        // Redirect to success page with appropriate context
        const redirectUrl = new URL('/auth/google/callback', request.url)
        redirectUrl.searchParams.set('success', 'true')
        redirectUrl.searchParams.set('action', oAuthState.action || 'connect')
        redirectUrl.searchParams.set('returnUrl', oAuthState.returnUrl || '/dashboard')

        return NextResponse.redirect(redirectUrl)

    } catch (error) {
        console.error('Unexpected error in OAuth callback:', error)

        const redirectUrl = new URL('/auth/google/callback', request.url)
        redirectUrl.searchParams.set('error', 'unexpected_error')
        redirectUrl.searchParams.set('message', 'An unexpected error occurred')

        return NextResponse.redirect(redirectUrl)
    }
}

// Wrapper functions for the class methods
async function storeCalendarTokens(userId: string, tokens: GoogleCalendarTokens) {
    const googleAuth = createGoogleCalendarAuth()
    try {
        await googleAuth.storeUserTokens(userId, tokens)
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

async function testCalendarConnection(userId: string) {
    const googleAuth = createGoogleCalendarAuth()
    return await googleAuth.testUserConnection(userId)
}

/**
 * Handle other HTTP methods with appropriate error
 */
export async function POST() {
    return NextResponse.json(
        { error: 'Method not allowed. OAuth callback must use GET.' },
        { status: 405 }
    )
} 