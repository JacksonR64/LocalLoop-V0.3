import { NextResponse } from 'next/server'
import { createGoogleCalendarAuth } from '@/lib/google-auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
    console.log('[API] POST /api/calendar/create-event - Request received')

    try {
        // Get request body
        const body = await request.json()
        console.log('[API] Request body received:', {
            hasUserId: !!body.userId,
            hasEventData: !!body.eventData,
            eventTitle: body.eventData?.title
        })

        // Get current user from Supabase session
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.log('[API] Authentication failed:', authError?.message)
            return NextResponse.json(
                { error: 'Authentication required. Please log in to add events to your calendar.' },
                { status: 401 }
            )
        }

        const userId = user.id
        console.log('[API] Authenticated user:', userId)

        // Get event data from request
        const { eventData } = body

        if (!eventData) {
            console.log('[API] Missing event data in request')
            return NextResponse.json(
                { error: 'Event data is required' },
                { status: 400 }
            )
        }

        // Validate event data fields
        if (!eventData.title || !eventData.start_time || !eventData.end_time) {
            const missingFields = []
            if (!eventData.title) missingFields.push('title')
            if (!eventData.start_time) missingFields.push('start_time')
            if (!eventData.end_time) missingFields.push('end_time')

            console.log('[API] Missing event data fields:', missingFields)
            return NextResponse.json(
                { error: `Missing event data fields: ${missingFields.join(', ')}` },
                { status: 400 }
            )
        }

        console.log('[API] Event data validated successfully:', {
            title: eventData.title,
            start_time: eventData.start_time,
            end_time: eventData.end_time,
            location: eventData.location
        })

        // Initialize Google Calendar auth
        const googleAuth = createGoogleCalendarAuth()

        // Create the calendar event
        console.log('[API] Creating calendar event for user:', userId)
        const calendarEvent = await googleAuth.createEventForUser(userId, {
            title: eventData.title,
            description: eventData.description || '',
            location: eventData.location || '',
            startDate: new Date(eventData.start_time),
            endDate: new Date(eventData.end_time),
            attendeeEmails: [] // Optional: could add event organizer email
        })

        if (calendarEvent.success) {
            return NextResponse.json({
                success: true,
                event: calendarEvent.event,
                message: 'Event successfully added to your Google Calendar'
            })
        } else {
            console.log('[API] Calendar event creation failed:', calendarEvent.error)
            return NextResponse.json(
                { error: calendarEvent.error || 'Failed to create calendar event' },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('[API] Error creating calendar event:', error)
        return NextResponse.json(
            { error: 'Internal server error while creating calendar event' },
            { status: 500 }
        )
    }
} 