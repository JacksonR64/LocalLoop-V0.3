import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GoogleCalendarAuth } from '@/lib/google-auth'
import { z } from 'zod'

// Request schema for adding calendar events
const addToCalendarSchema = z.object({
    payment_intent_id: z.string(),
    event_id: z.string().uuid(),
    event_details: z.object({
        title: z.string(),
        description: z.string().optional(),
        start_time: z.string(),
        end_time: z.string(),
        location: z.string().optional(),
        timezone: z.string().optional().default('UTC')
    }),
    customer_email: z.string().email()
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate request
        const validationResult = addToCalendarSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request data',
                    details: validationResult.error.errors
                },
                { status: 400 }
            )
        }

        const { payment_intent_id, event_id, event_details, customer_email } = validationResult.data
        const supabase = await createServerSupabaseClient()

        // Check if this is a sample/demo event (Event 7: Startup Pitch Night)
        const isSampleEvent = event_id === 'a0ddf64f-cf33-8a49-eccf-7379c9aab046'

        if (isSampleEvent) {
            // For sample events, verify the payment intent ID format and proceed without database lookup
            if (!payment_intent_id.startsWith('pi_')) {
                return NextResponse.json(
                    { error: 'Invalid payment intent ID format' },
                    { status: 400 }
                )
            }

            // For guest purchases on sample events, initiate OAuth flow
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                const oauthUrl = `/api/auth/google/connect?action=add_to_calendar&payment_intent_id=${payment_intent_id}&event_id=${event_id}&return_url=${encodeURIComponent('/checkout/success')}`

                return NextResponse.json({
                    success: false,
                    oauth_required: true,
                    oauth_url: oauthUrl,
                    message: 'Google Calendar authorization required'
                })
            }

            // Try to add to calendar for authenticated users
            const calendarAuth = new GoogleCalendarAuth()

            try {
                const result = await calendarAuth.createEventForUser(user.id, {
                    title: event_details.title,
                    description: event_details.description || 'Event purchased through LocalLoop',
                    location: event_details.location,
                    startDate: new Date(event_details.start_time),
                    endDate: new Date(event_details.end_time),
                    attendeeEmails: [customer_email]
                })

                if (result.success && result.eventId) {
                    return NextResponse.json({
                        success: true,
                        message: 'Event successfully added to Google Calendar',
                        calendar_event_id: result.eventId
                    })
                } else {
                    return NextResponse.json({
                        success: false,
                        error: result.error || 'Failed to add event to calendar',
                        fallback_action: 'connect_calendar'
                    }, { status: 400 })
                }
            } catch (calendarError) {
                console.error('Calendar integration error:', calendarError)
                return NextResponse.json({
                    success: false,
                    error: 'Calendar service temporarily unavailable',
                    fallback_action: 'retry_later'
                }, { status: 500 })
            }
        }

        // For non-sample events, use the original database lookup logic
        // Verify the payment intent exists and is successful
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, status, user_id, google_calendar_event_id, added_to_google_calendar')
            .eq('stripe_payment_intent_id', payment_intent_id)
            .eq('event_id', event_id)
            .single()

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found or invalid' },
                { status: 404 }
            )
        }

        if (order.status !== 'completed') {
            return NextResponse.json(
                { error: 'Order is not completed' },
                { status: 400 }
            )
        }

        // Check if already added to calendar
        if (order.added_to_google_calendar && order.google_calendar_event_id) {
            return NextResponse.json({
                success: true,
                message: 'Event already added to calendar',
                calendar_event_id: order.google_calendar_event_id
            })
        }

        // Get user if authenticated (for existing Google Calendar connection)
        const { data: { user } } = await supabase.auth.getUser()

        // For guest purchases, we need to initiate OAuth flow
        if (!user || !order.user_id) {
            // Return OAuth initiation URL for guest users
            const oauthUrl = `/api/auth/google/connect?action=add_to_calendar&payment_intent_id=${payment_intent_id}&event_id=${event_id}&return_url=${encodeURIComponent('/checkout/success')}`

            return NextResponse.json({
                success: false,
                oauth_required: true,
                oauth_url: oauthUrl,
                message: 'Google Calendar authorization required'
            })
        }

        // Try to add to calendar for authenticated users
        const calendarAuth = new GoogleCalendarAuth()

        try {
            const result = await calendarAuth.createEventForUser(user.id, {
                title: event_details.title,
                description: event_details.description || 'Event purchased through LocalLoop',
                location: event_details.location,
                startDate: new Date(event_details.start_time),
                endDate: new Date(event_details.end_time),
                attendeeEmails: [customer_email]
            })

            if (result.success && result.eventId) {
                // Update order with calendar event ID
                await supabase
                    .from('orders')
                    .update({
                        google_calendar_event_id: result.eventId,
                        added_to_google_calendar: true,
                        calendar_add_attempted_at: new Date().toISOString()
                    })
                    .eq('id', order.id)

                return NextResponse.json({
                    success: true,
                    message: 'Event successfully added to Google Calendar',
                    calendar_event_id: result.eventId
                })
            } else {
                // Update order with error information
                await supabase
                    .from('orders')
                    .update({
                        added_to_google_calendar: false,
                        calendar_add_attempted_at: new Date().toISOString(),
                        calendar_add_error: result.error || 'Unknown error'
                    })
                    .eq('id', order.id)

                return NextResponse.json({
                    success: false,
                    error: result.error || 'Failed to add event to calendar',
                    fallback_action: 'connect_calendar'
                }, { status: 400 })
            }
        } catch (calendarError) {
            console.error('Calendar integration error:', calendarError)

            // Update order with error information
            await supabase
                .from('orders')
                .update({
                    added_to_google_calendar: false,
                    calendar_add_attempted_at: new Date().toISOString(),
                    calendar_add_error: calendarError instanceof Error ? calendarError.message : 'Unknown error'
                })
                .eq('id', order.id)

            return NextResponse.json({
                success: false,
                error: 'Calendar service temporarily unavailable',
                fallback_action: 'retry_later'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Add to calendar API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 