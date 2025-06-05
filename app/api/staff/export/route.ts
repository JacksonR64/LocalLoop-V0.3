import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { authenticateStaff } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        // Authenticate and authorize staff access
        const authResult = await authenticateStaff()
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.statusCode }
            )
        }

        const { user } = authResult
        const supabase = await createServerSupabaseClient()

        // Ensure user exists (this should never happen due to auth check above, but satisfies TypeScript)
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 400 })
        }

        const body = await request.json()
        const { type, filters = {} } = body

        // Validate export type
        if (!['attendees', 'analytics', 'events', 'summary'].includes(type)) {
            return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
        }

        let csvData: any[] = []
        let filename = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`

        switch (type) {
            case 'attendees':
                csvData = await exportAttendees(supabase, filters, user.role, user.id)
                filename = `attendees-export-${new Date().toISOString().split('T')[0]}.csv`
                break

            case 'analytics':
                csvData = await exportAnalytics(supabase, filters, user.role, user.id)
                filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
                break

            case 'events':
                csvData = await exportEvents(supabase, filters, user.role, user.id)
                filename = `events-export-${new Date().toISOString().split('T')[0]}.csv`
                break

            case 'summary':
                csvData = await exportSummary(supabase, filters)
                filename = `summary-export-${new Date().toISOString().split('T')[0]}.csv`
                break

            default:
                return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
        }

        // Generate CSV content
        const csvContent = generateCSV(csvData)

        // Return CSV content with appropriate headers
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache'
            }
        })

    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json(
            { error: 'Failed to generate export' },
            { status: 500 }
        )
    }
}

async function exportAttendees(supabase: any, filters: Record<string, unknown>, userRole: string, userId: string) {
    const { eventId, status, checkedIn } = filters

    let query = supabase
        .from('rsvps')
        .select(`
      id,
      status,
      check_in_time,
      created_at,
      guest_name,
      guest_email,
      attendee_names,
      events!inner(id, title, start_time, organizer_id),
      users(id, email, display_name)
    `)
        .order('created_at', { ascending: false })

    // Apply filters
    if (eventId) query = query.eq('event_id', eventId)
    if (status) query = query.eq('status', status)
    if (checkedIn === 'true') query = query.not('check_in_time', 'is', null)
    if (checkedIn === 'false') query = query.is('check_in_time', null)

    // Role-based filtering for organizers
    if (userRole === 'organizer') {
        query = query.eq('events.organizer_id', userId)
    }

    const { data: rsvps, error: rsvpsError } = await query

    if (rsvpsError) {
        console.error('RSVP fetch error:', rsvpsError)
        throw new Error('Failed to fetch RSVP data')
    }

    // Also fetch ticket data
    let ticketQuery = supabase
        .from('tickets')
        .select(`
      id,
      status,
      check_in_time,
      created_at,
      attendee_name,
      attendee_email,
      confirmation_code,
      orders!inner(
        id,
        total,
        status,
        customer_email,
        customer_name
      ),
      ticket_types!inner(
        id,
        name,
        price
      ),
      events!inner(
        id,
        title,
        start_time,
        location
      )
    `)

    if (eventId) ticketQuery = ticketQuery.eq('events.id', eventId)
    if (userRole === 'organizer') {
        ticketQuery = ticketQuery.eq('events.organizer_id', userId)
    }

    const { data: tickets, error: ticketError } = await ticketQuery

    if (ticketError) {
        console.error('Ticket fetch error:', ticketError)
        throw new Error('Failed to fetch ticket data')
    }

    // Transform and combine data
    const attendeeData: Record<string, unknown>[] = []

    // Add RSVP attendees
    rsvps?.forEach((rsvp: any) => {
        attendeeData.push({
            'Name': rsvp.users?.display_name || rsvp.guest_name || 'Unknown',
            'Email': rsvp.users?.email || rsvp.guest_email || 'Unknown',
            'Type': 'Free RSVP',
            'Event': rsvp.events.title,
            'Event Date': new Date(rsvp.events.start_time).toLocaleDateString(),
            'Event Location': rsvp.events.location || 'Not specified',
            'Status': rsvp.status,
            'Ticket Type': 'Free RSVP',
            'Ticket Price': 'Free',
            'Registration Date': new Date(rsvp.created_at).toLocaleDateString(),
            'Check-in Status': rsvp.check_in_time ? 'Checked In' : 'Not Checked In',
            'Check-in Time': rsvp.check_in_time ? new Date(rsvp.check_in_time).toLocaleDateString() : '',
            'Confirmation Code': '',
            'Order ID': '',
            'Order Total': '',
            'Order Status': '',
            'Attendee Count': 1,
            'User ID': rsvp.users?.id || '',
            'Event ID': rsvp.events.id
        })
    })

    // Add ticket attendees
    tickets?.forEach((ticket: any) => {
        attendeeData.push({
            'Name': ticket.attendee_name || ticket.orders.customer_name || 'Unknown',
            'Email': ticket.attendee_email || ticket.orders.customer_email || 'Unknown',
            'Type': 'Paid Ticket',
            'Event': ticket.events.title,
            'Event Date': new Date(ticket.events.start_time).toLocaleDateString(),
            'Event Location': ticket.events.location || 'Not specified',
            'Status': ticket.status,
            'Ticket Type': ticket.ticket_types.name,
            'Ticket Price': `$${(ticket.ticket_types.price / 100).toFixed(2)}`,
            'Registration Date': new Date(ticket.created_at).toLocaleDateString(),
            'Check-in Status': ticket.check_in_time ? 'Checked In' : 'Not Checked In',
            'Check-in Time': ticket.check_in_time ? new Date(ticket.check_in_time).toLocaleDateString() : '',
            'Confirmation Code': ticket.confirmation_code || '',
            'Order ID': ticket.orders.id,
            'Order Total': `$${(ticket.orders.total / 100).toFixed(2)}`,
            'Order Status': ticket.orders.status,
            'Attendee Count': 1,
            'User ID': '',
            'Event ID': ticket.events.id
        })
    })

    return attendeeData
}

async function exportAnalytics(supabase: any, filters: Record<string, unknown>, userRole: string, userId: string) {
    const { timeRange = '30d' } = filters

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
        case '7d':
            startDate.setDate(now.getDate() - 7)
            break
        case '30d':
            startDate.setDate(now.getDate() - 30)
            break
        case '90d':
            startDate.setDate(now.getDate() - 90)
            break
        case '1y':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        default:
            startDate.setDate(now.getDate() - 30)
    }

    let query = supabase
        .from('events')
        .select(`
      id,
      title,
      start_time,
      capacity,
      rsvps(id, status, check_in_time),
      orders(id, total, status, tickets(id, status, check_in_time))
    `)
        .gte('created_at', startDate.toISOString())

    if (userRole === 'organizer') {
        query = query.eq('organizer_id', userId)
    }

    const { data: events, error } = await query

    if (error) {
        throw new Error('Failed to fetch analytics data')
    }

    const analyticsData = events?.map((event: any) => {
        const totalAttendees = (event.rsvps?.filter((rsvp: any) => rsvp.status === 'confirmed').length || 0) +
            (event.orders?.filter((order: any) => order.status === 'completed').length || 0)

        const checkedInCount = (event.rsvps?.filter((rsvp: any) => rsvp.check_in_time).length || 0) +
            (event.orders?.reduce((sum: number, order: any) =>
                sum + (order.tickets?.filter((ticket: any) => ticket.check_in_time).length || 0), 0) || 0)

        const revenue = event.orders
            ?.filter((order: any) => order.status === 'completed')
            ?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0

        return {
            'Event ID': event.id,
            'Event Title': event.title,
            'Event Date': new Date(event.start_time).toLocaleDateString(),
            'Total Attendees': totalAttendees,
            'Total Revenue': `$${(revenue / 100).toFixed(2)}`,
            'Capacity': event.capacity || 0,
            'Capacity Utilization': event.capacity ? `${((totalAttendees / event.capacity) * 100).toFixed(1)}%` : 'N/A',
            'RSVP Count': (event.rsvps?.filter((rsvp: any) => rsvp.status === 'confirmed').length || 0),
            'Ticket Count': (event.orders?.filter((order: any) => order.status === 'completed').length || 0),
            'Check-in Rate': totalAttendees > 0 ? `${((checkedInCount / totalAttendees) * 100).toFixed(1)}%` : '0%',
            'Revenue Per Attendee': totalAttendees > 0 ? `$${(revenue / 100 / totalAttendees).toFixed(2)}` : '$0.00'
        }
    }) || []

    return analyticsData
}

async function exportEvents(supabase: any, filters: Record<string, unknown>, userRole: string, userId: string) {
    let query = supabase
        .from('events')
        .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      location,
      capacity,
      status,
      published,
      created_at,
      ticket_types(name, price),
      rsvps(id, status),
      orders(id, total, status)
    `)

    if (userRole === 'organizer') {
        query = query.eq('organizer_id', userId)
    }

    const { data: events, error } = await query

    if (error) {
        throw new Error('Failed to fetch events data')
    }

    const eventData = events?.map((event: any) => {
        const totalAttendees = (event.rsvps?.filter((rsvp: any) => rsvp.status === 'confirmed').length || 0) +
            (event.orders?.filter((order: any) => order.status === 'completed').length || 0)

        const totalRevenue = event.orders
            ?.filter((order: any) => order.status === 'completed')
            ?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0

        const ticketTypes = event.ticket_types?.map((tt: any) => `${tt.name} ($${(tt.price / 100).toFixed(2)})`).join(', ') || 'Free Event'

        return {
            'Event ID': event.id,
            'Title': event.title,
            'Description': event.description?.replace(/\n/g, ' ').substring(0, 100) + '...' || '',
            'Start Time': new Date(event.start_time).toLocaleDateString(),
            'End Time': new Date(event.end_time).toLocaleDateString(),
            'Location': event.location || 'Not specified',
            'Capacity': event.capacity || 0,
            'Status': event.status,
            'Published': event.published ? 'Yes' : 'No',
            'Created Date': new Date(event.created_at).toLocaleDateString(),
            'Total Attendees': totalAttendees,
            'Total Revenue': `$${(totalRevenue / 100).toFixed(2)}`,
            'Ticket Types': ticketTypes,
            'Capacity Utilization': event.capacity && event.capacity > 0
                ? `${((totalAttendees / event.capacity) * 100).toFixed(1)}%`
                : 'N/A'
        }
    }) || []

    return eventData
}

async function exportSummary(supabase: any, filters: Record<string, unknown>) {
    const { timeRange = '30d' } = filters

    // This would typically aggregate data across all events
    // For now, return a simple summary structure
    const summaryData = [{
        'Report Date': new Date().toLocaleDateString('en-US'),
        'Time Range': timeRange,
        'Total Events': 0,
        'Total Attendees': 0,
        'Total Revenue': '$0.00',
        'Average Attendance': '0.0',
        'Conversion Rate': '0.0%',
        'Growth Rate': '0.0%'
    }]

    return summaryData
}

function generateCSV(data: Record<string, unknown>[]): string {
    if (!data || data.length === 0) {
        return 'No data available for export'
    }

    const headers = Object.keys(data[0])
    const rows = [headers]

    data.forEach((item: any) => {
        const row = headers.map(header => {
            const value = item[header]
            if (value === null || value === undefined) {
                return ''
            }
            const str = String(value)
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`
            }
            return str
        })
        rows.push(row)
    })

    return rows.map(row => row.join(',')).join('\n')
} 