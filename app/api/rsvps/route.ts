import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendRSVPConfirmationEmail } from '@/lib/email-service'
import { z } from 'zod'

// RSVP creation schema
const rsvpSchema = z.object({
    event_id: z.string().min(1, 'Event ID is required'),
    // For logged-in users
    user_id: z.string().uuid().optional(),
    // For guest users
    guest_email: z.string().email().optional(),
    guest_name: z.string().min(1).optional(),
    // RSVP details
    notes: z.string().optional(),
}).refine(
    (data) => (data.user_id && !data.guest_email) || (!data.user_id && data.guest_email && data.guest_name),
    {
        message: "Either user_id OR guest_email and guest_name must be provided",
        path: ["user_id"],
    }
)

// GET /api/rsvps - Get RSVPs for current user
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { data: rsvps, error } = await supabase
            .from('rsvps')
            .select(`
                *,
                events:event_id (
                    id,
                    title,
                    start_time,
                    end_time,
                    location,
                    image_url
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching RSVPs:', error)
            return NextResponse.json(
                { error: 'Failed to fetch RSVPs' },
                { status: 500 }
            )
        }

        return NextResponse.json({ rsvps })
    } catch (error) {
        console.error('Unexpected error in GET /api/rsvps:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/rsvps - Create new RSVP
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServerSupabaseClient()

        // Get current user BEFORE validation (important for validation logic)
        const { data: { user } } = await supabase.auth.getUser()

        // If user is authenticated, add user_id to body for validation
        const bodyWithAuth = user
            ? { ...body, user_id: user.id }
            : body

        // Validate request body (now includes user_id if authenticated)
        const result = rsvpSchema.safeParse(bodyWithAuth)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: result.error.format() },
                { status: 400 }
            )
        }

        const rsvpData = result.data

        // If user is logged in, use their ID, otherwise use guest info
        const finalRsvpData = user
            ? {
                event_id: rsvpData.event_id,
                user_id: user.id,
                notes: rsvpData.notes,
                status: 'confirmed' as const,
            }
            : {
                event_id: rsvpData.event_id,
                guest_email: rsvpData.guest_email!,
                guest_name: rsvpData.guest_name!,
                notes: rsvpData.notes,
                status: 'confirmed' as const,
            }

        // Check if event exists and is open for registration
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select(`
                id, 
                title, 
                description,
                start_time,
                end_time,
                location,
                location_details,
                slug,
                published,
                cancelled,
                capacity,
                users:organizer_id (
                    id,
                    email,
                    display_name
                )
            `)
            .eq('id', rsvpData.event_id)
            .single()

        if (eventError || !event) {
            console.error('Event lookup error:', eventError)
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        // Check if event is published and not cancelled (instead of is_open_for_registration)
        if (!event.published || event.cancelled) {
            return NextResponse.json(
                { error: 'Event is not open for registration' },
                { status: 400 }
            )
        }

        // Get current RSVP count from the rsvps table
        const { count: currentRSVPs, error: countError } = await supabase
            .from('rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', rsvpData.event_id)
            .eq('status', 'confirmed')

        if (countError) {
            console.error('Error counting RSVPs:', countError)
            return NextResponse.json(
                { error: 'Failed to check event capacity' },
                { status: 500 }
            )
        }

        // Check if event is at capacity
        if (event.capacity && currentRSVPs !== null && currentRSVPs >= event.capacity) {
            return NextResponse.json(
                { error: 'Event is at full capacity' },
                { status: 400 }
            )
        }

        // Check for existing RSVP to prevent duplicates
        let existingRsvpQuery = supabase
            .from('rsvps')
            .select('id')
            .eq('event_id', rsvpData.event_id)
            .eq('status', 'confirmed')

        if (user) {
            existingRsvpQuery = existingRsvpQuery.eq('user_id', user.id)
        } else {
            existingRsvpQuery = existingRsvpQuery.eq('guest_email', rsvpData.guest_email!)
        }

        const { data: existingRsvp } = await existingRsvpQuery.single()

        if (existingRsvp) {
            return NextResponse.json(
                { error: 'You have already RSVP\'d to this event' },
                { status: 409 }
            )
        }

        // Create the RSVP
        const { data: newRsvp, error: rsvpError } = await supabase
            .from('rsvps')
            .insert(finalRsvpData)
            .select()
            .single()

        if (rsvpError) {
            console.error('Error creating RSVP:', rsvpError)
            return NextResponse.json(
                { error: 'Failed to create RSVP' },
                { status: 500 }
            )
        }

        // Send confirmation email
        try {
            const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || rsvpData.guest_name!
            const userEmail = user?.email || rsvpData.guest_email!

            // Handle organizer data from Supabase join
            const organizer = Array.isArray(event.users) ? event.users[0] : event.users
            const organizerData = organizer as { id: string; email: string; display_name: string } | null

            // Format date and time for email
            const eventDate = new Date(event.start_time).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })

            const eventTime = new Date(event.start_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })

            // Calculate cancellation deadline (24 hours before event)
            const cancellationDeadline = new Date(new Date(event.start_time).getTime() - 24 * 60 * 60 * 1000)
                .toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                })

            const emailResult = await sendRSVPConfirmationEmail({
                to: userEmail,
                userName,
                userEmail,
                eventTitle: event.title,
                eventDescription: event.description || 'No description provided',
                eventDate,
                eventTime,
                eventLocation: event.location,
                eventAddress: event.location_details || event.location,
                organizerName: organizerData?.display_name || 'Event Organizer',
                organizerEmail: organizerData?.email || 'organizer@localloop.app',
                rsvpId: newRsvp.id,
                guestCount: 1, // Default to 1, can be enhanced later for multiple guests
                isAuthenticated: !!user,
                eventSlug: event.slug,
                cancellationDeadline
            })

            if (!emailResult.success) {
                console.warn('Failed to send confirmation email:', emailResult.error)
                // Don't fail the RSVP creation if email fails - just log it
            } else {
                console.log('Confirmation email sent successfully:', emailResult.messageId)
            }

        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError)
            // Don't fail the RSVP creation if email fails
        }

        // TODO: Add to Google Calendar if opted in

        return NextResponse.json({
            message: 'RSVP created successfully',
            rsvp: newRsvp
        }, { status: 201 })

    } catch (error) {
        console.error('Unexpected error in POST /api/rsvps:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 