import { supabase } from './supabase'
import { createServerSupabaseClient } from './supabase-server'
import {
    GoogleCalendarService,
    GoogleCalendarTokens,
    areTokensExpired,
    createGoogleCalendarService
} from './google-calendar'
import { User } from '@supabase/supabase-js'

/**
 * Interface for Google Calendar OAuth state
 */
export interface GoogleAuthState {
    userId: string
    returnUrl?: string
    action?: 'connect' | 'create_event' | 'sync'
}

/**
 * Interface for encrypted token storage in database
 */
export interface EncryptedCalendarTokens {
    encrypted_data: string
    created_at: string
    updated_at: string
    expires_at: string
}

/**
 * Google Calendar OAuth Integration Service
 * Handles OAuth flow, token storage, and calendar access management
 */
export class GoogleCalendarAuth {
    private calendarService: GoogleCalendarService

    constructor() {
        this.calendarService = createGoogleCalendarService()
    }

    /**
     * Start OAuth 2.0 authorization flow
     * @param user - Current Supabase user
     * @param options - OAuth flow options
     * @returns Authorization URL for user consent
     */
    async startOAuthFlow(
        user: User,
        options: {
            returnUrl?: string
            action?: 'connect' | 'create_event' | 'sync'
        } = {}
    ): Promise<string> {
        if (!user) {
            throw new Error('User must be authenticated to start Google Calendar OAuth flow')
        }

        // Create state parameter with user info for security
        const state: GoogleAuthState = {
            userId: user.id,
            returnUrl: options.returnUrl || '/dashboard',
            action: options.action || 'connect',
        }

        const stateString = Buffer.from(JSON.stringify(state)).toString('base64url')

        return this.calendarService.getAuthUrl(stateString)
    }

    /**
     * Complete OAuth 2.0 flow and store tokens
     * @param code - Authorization code from Google
     * @param state - State parameter from OAuth flow
     * @returns User info and success status
     */
    async completeOAuthFlow(
        code: string,
        state: string
    ): Promise<{
        success: boolean
        user?: User
        returnUrl?: string
        action?: string
        error?: string
    }> {
        try {
            // Decode and validate state parameter
            const authState: GoogleAuthState = JSON.parse(
                Buffer.from(state, 'base64url').toString()
            )

            // Get tokens from Google
            const tokens = await this.calendarService.getTokensFromCode(code)

            // Store tokens securely in database
            await this.storeUserTokens(authState.userId, tokens)

            // Get user info for response
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                throw new Error('Failed to get user information after OAuth completion')
            }

            return {
                success: true,
                user,
                returnUrl: authState.returnUrl,
                action: authState.action,
            }
        } catch (error) {
            console.error('Error completing Google Calendar OAuth flow:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            }
        }
    }

    /**
     * Store Google Calendar tokens securely in Supabase
     * @param userId - Supabase user ID
     * @param tokens - Google Calendar tokens
     */
    async storeUserTokens(userId: string, tokens: GoogleCalendarTokens): Promise<void> {
        try {
            // Simple encryption (in production, use proper encryption)
            const encryptedTokens = Buffer.from(JSON.stringify(tokens)).toString('base64')

            const supabaseServer = await createServerSupabaseClient()

            const { error } = await supabaseServer
                .from('users')
                .update({
                    google_calendar_token: encryptedTokens,
                    google_calendar_connected: true,
                    google_calendar_connected_at: new Date().toISOString(),
                    google_calendar_expires_at: new Date(tokens.expiry_date).toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (error) {
                console.error('Error storing Google Calendar tokens:', error)
                throw new Error('Failed to store Google Calendar tokens')
            }
        } catch (error) {
            console.error('Error in storeUserTokens:', error)
            throw error
        }
    }

    /**
     * Get user's Google Calendar tokens from database
     * @param userId - Supabase user ID
     * @returns Decrypted tokens or null if not found
     */
    async getUserTokens(userId: string): Promise<GoogleCalendarTokens | null> {
        try {
            const supabaseServer = await createServerSupabaseClient()

            const { data, error } = await supabaseServer
                .from('users')
                .select('google_calendar_token, google_calendar_connected, google_calendar_expires_at')
                .eq('id', userId)
                .single()

            if (error || !data?.google_calendar_token || !data.google_calendar_connected) {
                return null
            }

            // Decrypt tokens (simple base64 decoding - use proper encryption in production)
            const tokens: GoogleCalendarTokens = JSON.parse(
                Buffer.from(data.google_calendar_token, 'base64').toString()
            )

            return tokens
        } catch (error) {
            console.error('Error getting user Google Calendar tokens:', error)
            return null
        }
    }

    /**
     * Get user's Google Calendar service with valid tokens
     * @param userId - Supabase user ID
     * @returns Configured calendar service or null if not connected
     */
    async getUserCalendarService(userId: string): Promise<GoogleCalendarService | null> {
        try {
            let tokens = await this.getUserTokens(userId)

            if (!tokens) {
                return null
            }

            // Check if tokens need refresh
            if (areTokensExpired(tokens)) {
                if (!tokens.refresh_token) {
                    // No refresh token available, user needs to re-authenticate
                    await this.disconnectUserCalendar(userId)
                    return null
                }

                // Refresh tokens
                this.calendarService.setCredentials(tokens)
                const newTokens = await this.calendarService.refreshTokens()

                // Store updated tokens
                await this.storeUserTokens(userId, newTokens)
                tokens = newTokens
            }

            // Create new service instance with valid tokens
            const service = createGoogleCalendarService()
            service.setCredentials(tokens)

            return service
        } catch (error) {
            console.error('Error getting user calendar service:', error)
            // If there's an error, disconnect the user's calendar
            await this.disconnectUserCalendar(userId)
            return null
        }
    }

    /**
     * Disconnect user's Google Calendar
     * @param userId - Supabase user ID
     */
    async disconnectUserCalendar(userId: string): Promise<void> {
        try {
            const supabaseServer = await createServerSupabaseClient()

            const { error } = await supabaseServer
                .from('users')
                .update({
                    google_calendar_token: null,
                    google_calendar_connected: false,
                    google_calendar_connected_at: null,
                    google_calendar_expires_at: null,
                    google_calendar_sync_enabled: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (error) {
                console.error('Error disconnecting Google Calendar:', error)
                throw new Error('Failed to disconnect Google Calendar')
            }
        } catch (error) {
            console.error('Error in disconnectUserCalendar:', error)
            throw error
        }
    }

    /**
     * Check if user has connected Google Calendar
     * @param userId - Supabase user ID
     * @returns Connection status and details
     */
    async getConnectionStatus(userId: string): Promise<{
        connected: boolean
        connectedAt?: string
        expiresAt?: string
        syncEnabled?: boolean
    }> {
        try {
            const supabaseServer = await createServerSupabaseClient()

            const { data, error } = await supabaseServer
                .from('users')
                .select(`
          google_calendar_connected,
          google_calendar_connected_at,
          google_calendar_expires_at,
          google_calendar_sync_enabled
        `)
                .eq('id', userId)
                .single()

            if (error || !data) {
                return { connected: false }
            }

            return {
                connected: data.google_calendar_connected || false,
                connectedAt: data.google_calendar_connected_at,
                expiresAt: data.google_calendar_expires_at,
                syncEnabled: data.google_calendar_sync_enabled || false,
            }
        } catch (error) {
            console.error('Error getting Google Calendar connection status:', error)
            return { connected: false }
        }
    }

    /**
     * Test user's Google Calendar connection
     * @param userId - Supabase user ID
     * @returns Connection test results
     */
    async testUserConnection(userId: string): Promise<{
        connected: boolean
        primaryCalendar?: string
        error?: string
    }> {
        try {
            const calendarService = await this.getUserCalendarService(userId)

            if (!calendarService) {
                return {
                    connected: false,
                    error: 'Google Calendar not connected or tokens expired',
                }
            }

            return await calendarService.testConnection()
        } catch (error) {
            console.error('Error testing Google Calendar connection:', error)
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Connection test failed',
            }
        }
    }

    /**
     * Enable/disable automatic calendar sync for user
     * @param userId - Supabase user ID
     * @param enabled - Whether to enable sync
     */
    async setSyncEnabled(userId: string, enabled: boolean): Promise<void> {
        try {
            const supabaseServer = await createServerSupabaseClient()

            const { error } = await supabaseServer
                .from('users')
                .update({
                    google_calendar_sync_enabled: enabled,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)

            if (error) {
                console.error('Error updating Google Calendar sync setting:', error)
                throw new Error('Failed to update sync setting')
            }
        } catch (error) {
            console.error('Error in setSyncEnabled:', error)
            throw error
        }
    }

    /**
     * Create a calendar event for user
     * @param userId - Supabase user ID
     * @param eventData - Event details
     * @returns Created event information
     */
    async createEventForUser(
        userId: string,
        eventData: {
            title: string
            description?: string
            location?: string
            startDate: Date
            endDate: Date
            attendeeEmails?: string[]
        }
    ): Promise<{ success: boolean; eventId?: string; error?: string }> {
        try {
            const calendarService = await this.getUserCalendarService(userId)

            if (!calendarService) {
                return {
                    success: false,
                    error: 'Google Calendar not connected. Please connect your calendar first.',
                }
            }

            const { convertToGoogleCalendarEvent } = await import('./google-calendar')
            const googleEvent = convertToGoogleCalendarEvent(eventData)

            const createdEvent = await calendarService.createEvent('primary', googleEvent)

            return {
                success: true,
                eventId: createdEvent.id || undefined,
            }
        } catch (error) {
            console.error('Error creating calendar event for user:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create calendar event',
            }
        }
    }
}

/**
 * Create a new Google Calendar Auth service instance
 */
export function createGoogleCalendarAuth(): GoogleCalendarAuth {
    return new GoogleCalendarAuth()
}

/**
 * Utility function to generate OAuth state parameter
 * @param userId - User ID
 * @param returnUrl - URL to return to after OAuth
 * @param action - Action being performed
 * @returns Base64 encoded state
 */
export function createOAuthState(
    userId: string,
    returnUrl?: string,
    action?: 'connect' | 'create_event' | 'sync'
): string {
    const state: GoogleAuthState = {
        userId,
        returnUrl: returnUrl || '/dashboard',
        action: action || 'connect',
    }

    return Buffer.from(JSON.stringify(state)).toString('base64url')
}

/**
 * Utility function to parse OAuth state parameter
 * @param state - Base64 encoded state
 * @returns Parsed state object
 */
export function parseOAuthState(state: string): GoogleAuthState {
    try {
        return JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
        throw new Error('Invalid OAuth state parameter')
    }
} 