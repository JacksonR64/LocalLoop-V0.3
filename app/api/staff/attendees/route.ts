import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
    try {
        // Authenticate and authorize staff access using session-based auth
        const supabase = await createServerSupabaseClient()

        // Get the current user from the session
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user role from the database
        const { data: userDetails, error: userError } = await supabase
            .from('users')
            .select('id, email, display_name, role')
            .eq('id', user.id)
            .single()

        if (userError || !userDetails) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user has organizer or admin role
        if (userDetails.role !== 'organizer' && userDetails.role !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get('event_id')
        const status = searchParams.get('status')
        const checkedIn = searchParams.get('checked_in')
        const search = searchParams.get('search')
        const sortBy = searchParams.get('sort_by') || 'created_at'
        const sortOrder = searchParams.get('sort_order') || 'desc'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = (page - 1) * limit

        // Build the base query for tickets (paid attendees)
        let ticketsQuery = supabase
            .from('tickets')
            .select(`
        id,
        customer_email,
        customer_name,
        attendee_email,
        attendee_name,
        status,
        check_in_time,
        confirmation_code,
        created_at,
        ticket_types (
          name,
          price
        ),
        events!inner (
          id,
          title,
          start_time,
          location,
          organizer_id
        ),
        orders (
          id,
          total_amount,
          status,
          users (
            id,
            display_name,
            email
          )
        )
      `)

        // Build the base query for RSVPs (free attendees)
        let rsvpsQuery = supabase
            .from('rsvps')
            .select(`
        id,
        guest_email,
        guest_name,
        status,
        check_in_time,
        created_at,
        events!inner (
          id,
          title,
          start_time,
          location,
          organizer_id
        ),
        users (
          id,
          display_name,
          email
        )
      `)

        // Role-based filtering: organizers can only see their own events
        if (userDetails.role === 'organizer') {
            ticketsQuery = ticketsQuery.eq('events.organizer_id', userDetails.id)
            rsvpsQuery = rsvpsQuery.eq('events.organizer_id', userDetails.id)
        }
        // Admins can see all events (no additional filtering needed)

        // Apply filters
        if (eventId) {
            ticketsQuery = ticketsQuery.eq('event_id', eventId)
            rsvpsQuery = rsvpsQuery.eq('event_id', eventId)
        }

        if (status) {
            ticketsQuery = ticketsQuery.eq('status', status)
            rsvpsQuery = rsvpsQuery.eq('status', status)
        }

        if (checkedIn === 'true') {
            ticketsQuery = ticketsQuery.not('check_in_time', 'is', null)
            rsvpsQuery = rsvpsQuery.not('check_in_time', 'is', null)
        } else if (checkedIn === 'false') {
            ticketsQuery = ticketsQuery.is('check_in_time', null)
            rsvpsQuery = rsvpsQuery.is('check_in_time', null)
        }

        // Execute queries
        const [ticketsResult, rsvpsResult] = await Promise.all([
            ticketsQuery,
            rsvpsQuery
        ])

        if (ticketsResult.error) {
            console.error('Error fetching tickets:', ticketsResult.error)
            return NextResponse.json({ error: 'Failed to fetch ticket data' }, { status: 500 })
        }

        if (rsvpsResult.error) {
            console.error('Error fetching RSVPs:', rsvpsResult.error)
            return NextResponse.json({ error: 'Failed to fetch RSVP data' }, { status: 500 })
        }

        // Transform and combine data
        const tickets = ticketsResult.data || []
        const rsvps = rsvpsResult.data || []

        // Convert tickets to attendee format
        const ticketAttendees = tickets.map(ticket => ({
            id: `ticket_${ticket.id}`,
            type: 'ticket' as const,
            name: ticket.attendee_name || ticket.customer_name || ticket.orders?.[0]?.users?.[0]?.display_name || 'Unknown',
            email: ticket.attendee_email || ticket.customer_email || ticket.orders?.[0]?.users?.[0]?.email || '',
            eventId: ticket.events?.[0]?.id,
            eventTitle: ticket.events?.[0]?.title,
            eventStartTime: ticket.events?.[0]?.start_time,
            eventLocation: ticket.events?.[0]?.location,
            status: ticket.status,
            checkedInAt: ticket.check_in_time,
            createdAt: ticket.created_at,
            ticketType: ticket.ticket_types?.[0]?.name,
            ticketPrice: ticket.ticket_types?.[0]?.price,
            confirmationCode: ticket.confirmation_code,
            orderId: ticket.orders?.[0]?.id,
            orderTotal: ticket.orders?.[0]?.total_amount,
            orderStatus: ticket.orders?.[0]?.status,
            userId: ticket.orders?.[0]?.users?.[0]?.id,
            attendeeCount: 1
        }))

        // Convert RSVPs to attendee format
        const rsvpAttendees = rsvps.map(rsvp => ({
            id: `rsvp_${rsvp.id}`,
            type: 'rsvp' as const,
            name: rsvp.guest_name || rsvp.users?.[0]?.display_name || 'Unknown',
            email: rsvp.guest_email || rsvp.users?.[0]?.email || '',
            eventId: rsvp.events?.[0]?.id,
            eventTitle: rsvp.events?.[0]?.title,
            eventStartTime: rsvp.events?.[0]?.start_time,
            eventLocation: rsvp.events?.[0]?.location,
            status: rsvp.status,
            checkedInAt: rsvp.check_in_time,
            createdAt: rsvp.created_at,
            attendeeCount: 1, // Each RSVP is for one person
            userId: rsvp.users?.[0]?.id,
            isMainAttendee: true // Always true for RSVPs since they are individual
        }))

        // Combine all attendees
        let allAttendees = [...ticketAttendees, ...rsvpAttendees]

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase()
            allAttendees = allAttendees.filter(attendee =>
                attendee.name.toLowerCase().includes(searchLower) ||
                attendee.email.toLowerCase().includes(searchLower) ||
                attendee.eventTitle?.toLowerCase().includes(searchLower) ||
                (attendee.type === 'ticket' && (attendee as any).confirmationCode?.toLowerCase().includes(searchLower))
            )
        }

        // Apply sorting
        allAttendees.sort((a, b) => {
            let aValue: string | number | null = a[sortBy as keyof typeof a] as string | number | null
            let bValue: string | number | null = b[sortBy as keyof typeof b] as string | number | null

            // Handle date sorting
            if (sortBy === 'created_at' || sortBy === 'checkedInAt' || sortBy === 'eventStartTime') {
                aValue = aValue ? new Date(aValue).getTime() : 0
                bValue = bValue ? new Date(bValue).getTime() : 0
            }

            // Handle string sorting
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = typeof bValue === 'string' ? bValue.toLowerCase() : ''
            }

            // Ensure we have numeric values for comparison
            const numericAValue = typeof aValue === 'number' ? aValue : 0
            const numericBValue = typeof bValue === 'number' ? bValue : 0
            const stringAValue = typeof aValue === 'string' ? aValue : ''
            const stringBValue = typeof bValue === 'string' ? bValue : ''

            // Compare values
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                if (numericAValue < numericBValue) return sortOrder === 'asc' ? -1 : 1
                if (numericAValue > numericBValue) return sortOrder === 'asc' ? 1 : -1
            } else {
                if (stringAValue < stringBValue) return sortOrder === 'asc' ? -1 : 1
                if (stringAValue > stringBValue) return sortOrder === 'asc' ? 1 : -1
            }
            return 0
        })

        // Apply pagination
        const total = allAttendees.length
        const paginatedAttendees = allAttendees.slice(offset, offset + limit)

        // Calculate summary stats
        const totalAttendees = total
        const checkedInCount = allAttendees.filter(a => a.checkedInAt).length
        const ticketHolders = allAttendees.filter(a => a.type === 'ticket').length
        const rsvpAttendeesCount = allAttendees.filter(a => a.type === 'rsvp').length
        const totalRevenue = allAttendees
            .filter(a => a.type === 'ticket')
            .reduce((sum, a) => sum + (a.ticketPrice || 0), 0)

        return NextResponse.json({
            attendees: paginatedAttendees,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: offset + limit < total
            },
            summary: {
                totalAttendees,
                checkedInCount,
                ticketHolders,
                rsvpAttendees: rsvpAttendeesCount,
                totalRevenue,
                checkInRate: totalAttendees > 0 ? (checkedInCount / totalAttendees * 100) : 0
            }
        })

    } catch (error) {
        console.error('Error in attendees API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 