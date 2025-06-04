import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get the user from the authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = authHeader.substring(7) // Remove 'Bearer ' prefix

        // Verify the user and get their role
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, display_name, role')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user has organizer or admin role
        if (user.role !== 'organizer' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Fetch events based on user role
        let eventsQuery = supabase
            .from('events')
            .select(`
        id,
        title,
        slug,
        status,
        start_time,
        end_time,
        published,
        capacity,
        organizer_id,
        rsvp_count,
        total_revenue,
        created_at
      `)
            .order('created_at', { ascending: false })

        // Role-based filtering: organizers can only see their own events
        if (user?.role === 'organizer') {
            eventsQuery = eventsQuery.eq('organizer_id', user.id)
        }

        const { data: events, error: eventsError } = await eventsQuery

        if (eventsError) {
            console.error('Error fetching events:', eventsError)
            return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
        }

        // Calculate metrics
        const now = new Date()
        const totalEvents = events?.length || 0
        const activeEvents = events?.filter(event =>
            event.published &&
            new Date(event.start_time) > now
        ).length || 0
        const draftEvents = events?.filter(event => !event.published).length || 0
        const totalAttendees = events?.reduce((sum, event) => sum + (event.rsvp_count || 0), 0) || 0
        const totalRevenue = events?.reduce((sum, event) => sum + (event.total_revenue || 0), 0) || 0

        // Fetch ticket sales for each event
        const eventIds = events?.map(event => event.id) || []
        let ticketSales: { [key: string]: number } = {}

        if (eventIds.length > 0) {
            const { data: ticketCounts, error: ticketError } = await supabase
                .from('orders')
                .select('event_id, tickets_count')
                .in('event_id', eventIds)
                .eq('status', 'completed')

            if (!ticketError && ticketCounts) {
                ticketCounts.forEach(order => {
                    ticketSales[order.event_id] = (ticketSales[order.event_id] || 0) + (order.tickets_count || 0)
                })
            }
        }

        // Add ticket sales data to events
        const eventsWithTicketSales = events?.map(event => ({
            ...event,
            ticket_sales: ticketSales[event.id] || 0,
            pending_rsvps: 0 // TODO: Implement pending RSVP calculation
        })) || []

        const metrics = {
            total_events: totalEvents,
            active_events: activeEvents,
            total_attendees: totalAttendees,
            total_revenue: totalRevenue,
            upcoming_events: activeEvents, // Same as active for now
            draft_events: draftEvents
        }

        return NextResponse.json({
            events: eventsWithTicketSales,
            metrics
        })

    } catch (error) {
        console.error('Staff dashboard API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 