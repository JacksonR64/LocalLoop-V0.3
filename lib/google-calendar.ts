import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

// Environment variables for Google Calendar API
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'

// Google Calendar API scopes
export const CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
] as const

// Types for Google Calendar integration
export interface GoogleCalendarEvent {
    id?: string
    summary: string
    description?: string
    location?: string
    start: {
        dateTime: string
        timeZone?: string
    }
    end: {
        dateTime: string
        timeZone?: string
    }
    attendees?: Array<{
        email: string
        displayName?: string
        responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
    }>
    reminders?: {
        useDefault: boolean
        overrides?: Array<{
            method: 'email' | 'popup'
            minutes: number
        }>
    }
}

export interface GoogleCalendarTokens {
    access_token: string
    refresh_token?: string
    scope: string
    token_type: string
    expiry_date: number
}

export interface CalendarSyncStatus {
    lastSync: Date
    success: boolean
    error?: string
    eventsProcessed: number
}

/**
 * Google Calendar API Service
 * Handles authentication, event creation, and calendar operations
 */
export class GoogleCalendarService {
    private oauth2Client: OAuth2Client
    private calendar: calendar_v3.Calendar

    constructor() {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            throw new Error('Google Calendar API credentials are not configured. Please check your environment variables.')
        }

        this.oauth2Client = new OAuth2Client(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_REDIRECT_URI
        )

        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    }

    /**
     * Get OAuth 2.0 authorization URL
     * @param state - Optional state parameter for security
     * @returns Authorization URL for user consent
     */
    getAuthUrl(state?: string): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Required for refresh token
            scope: [...CALENDAR_SCOPES],
            prompt: 'consent', // Force consent screen to get refresh token
            state: state || undefined,
        })
    }

    /**
     * Exchange authorization code for access tokens
     * @param code - Authorization code from Google OAuth callback
     * @returns Token object with access and refresh tokens
     */
    async getTokensFromCode(code: string): Promise<GoogleCalendarTokens> {
        try {
            const { tokens } = await this.oauth2Client.getToken(code)

            if (!tokens.access_token) {
                throw new Error('Failed to obtain access token from Google')
            }

            return {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || undefined,
                scope: tokens.scope || CALENDAR_SCOPES.join(' '),
                token_type: tokens.token_type || 'Bearer',
                expiry_date: tokens.expiry_date || Date.now() + (3600 * 1000), // Default 1 hour
            }
        } catch (error) {
            console.error('Error getting tokens from authorization code:', error)
            throw new Error('Failed to exchange authorization code for tokens')
        }
    }

    /**
     * Set credentials for API calls
     * @param tokens - Google Calendar API tokens
     */
    setCredentials(tokens: GoogleCalendarTokens): void {
        this.oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_type: tokens.token_type,
            expiry_date: tokens.expiry_date,
        })
    }

    /**
     * Refresh access token using refresh token
     * @returns Updated token object
     */
    async refreshTokens(): Promise<GoogleCalendarTokens> {
        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken()

            return {
                access_token: credentials.access_token!,
                refresh_token: credentials.refresh_token || undefined,
                scope: credentials.scope || CALENDAR_SCOPES.join(' '),
                token_type: credentials.token_type || 'Bearer',
                expiry_date: credentials.expiry_date || Date.now() + (3600 * 1000),
            }
        } catch (error) {
            console.error('Error refreshing access token:', error)
            throw new Error('Failed to refresh access token')
        }
    }

    /**
     * Create a calendar event
     * @param calendarId - Google Calendar ID (usually 'primary' for user's main calendar)
     * @param event - Event details
     * @returns Created event with Google Calendar ID
     */
    async createEvent(calendarId: string = 'primary', event: GoogleCalendarEvent): Promise<calendar_v3.Schema$Event> {
        try {
            const response = await this.calendar.events.insert({
                calendarId,
                requestBody: event,
                sendNotifications: true, // Send email notifications to attendees
            })

            if (!response.data) {
                throw new Error('No event data returned from Google Calendar')
            }

            return response.data
        } catch (error) {
            console.error('Error creating calendar event:', error)
            throw new Error('Failed to create calendar event')
        }
    }

    /**
     * Update an existing calendar event
     * @param calendarId - Google Calendar ID
     * @param eventId - Google Calendar event ID
     * @param event - Updated event details
     * @returns Updated event
     */
    async updateEvent(
        calendarId: string = 'primary',
        eventId: string,
        event: Partial<GoogleCalendarEvent>
    ): Promise<calendar_v3.Schema$Event> {
        try {
            const response = await this.calendar.events.update({
                calendarId,
                eventId,
                requestBody: event,
                sendNotifications: true,
            })

            if (!response.data) {
                throw new Error('No event data returned from Google Calendar')
            }

            return response.data
        } catch (error) {
            console.error('Error updating calendar event:', error)
            throw new Error('Failed to update calendar event')
        }
    }

    /**
     * Delete a calendar event
     * @param calendarId - Google Calendar ID
     * @param eventId - Google Calendar event ID
     */
    async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
        try {
            await this.calendar.events.delete({
                calendarId,
                eventId,
                sendNotifications: true,
            })
        } catch (error) {
            console.error('Error deleting calendar event:', error)
            throw new Error('Failed to delete calendar event')
        }
    }

    /**
     * Get user's calendar list
     * @returns List of user's calendars
     */
    async getCalendarList(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
        try {
            const response = await this.calendar.calendarList.list()
            return response.data.items || []
        } catch (error) {
            console.error('Error getting calendar list:', error)
            throw new Error('Failed to get calendar list')
        }
    }

    /**
     * Get events from a calendar within a date range
     * @param calendarId - Google Calendar ID
     * @param timeMin - Start date (ISO string)
     * @param timeMax - End date (ISO string)
     * @returns List of calendar events
     */
    async getEvents(
        calendarId: string = 'primary',
        timeMin?: string,
        timeMax?: string
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            const response = await this.calendar.events.list({
                calendarId,
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            })

            return response.data.items || []
        } catch (error) {
            console.error('Error getting calendar events:', error)
            throw new Error('Failed to get calendar events')
        }
    }

    /**
     * Test API connection and permissions
     * @returns Basic user calendar info
     */
    async testConnection(): Promise<{ connected: boolean; primaryCalendar?: string; error?: string }> {
        try {
            const calendars = await this.getCalendarList()
            const primaryCalendar = calendars.find(cal => cal.primary)?.summary

            return {
                connected: true,
                primaryCalendar: primaryCalendar || 'Unknown',
            }
        } catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }
}

/**
 * Create a new Google Calendar service instance
 * @returns Google Calendar service
 */
export function createGoogleCalendarService(): GoogleCalendarService {
    return new GoogleCalendarService()
}

/**
 * Utility function to check if tokens are expired
 * @param tokens - Google Calendar tokens
 * @returns True if tokens are expired or will expire within 5 minutes
 */
export function areTokensExpired(tokens: GoogleCalendarTokens): boolean {
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
    return tokens.expiry_date < fiveMinutesFromNow
}

/**
 * Convert LocalLoop event to Google Calendar event format
 * @param event - LocalLoop event data
 * @returns Google Calendar event format
 */
export function convertToGoogleCalendarEvent(event: {
    title: string
    description?: string
    location?: string
    startDate: Date
    endDate: Date
    organizerEmail?: string
    attendeeEmails?: string[]
}): GoogleCalendarEvent {
    return {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
            dateTime: event.startDate.toISOString(),
            timeZone: 'America/New_York', // Default timezone - should be configurable
        },
        end: {
            dateTime: event.endDate.toISOString(),
            timeZone: 'America/New_York',
        },
        attendees: event.attendeeEmails?.map(email => ({
            email,
            responseStatus: 'needsAction' as const,
        })),
        reminders: {
            useDefault: true,
        },
    }
} 