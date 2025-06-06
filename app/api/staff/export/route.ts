import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { authenticateStaff } from '@/lib/auth'
import type { SupabaseClient } from '@supabase/supabase-js'

// Database entity interfaces
interface DatabaseEvent {
    id: string
    title: string
    start_time: string
    location?: string
    organizer_id: string
}

interface DatabaseUser {
    id: string
    email: string
    display_name?: string
}

interface DatabaseRSVP {
    id: string
    status: string
    check_in_time?: string
    created_at: string
    guest_name?: string
    guest_email?: string
    attendee_names?: string[]
    events: DatabaseEvent | DatabaseEvent[]
    users?: DatabaseUser | DatabaseUser[]
}

interface DatabaseTicketType {
    id: string
    name: string
    price: number
}

interface DatabaseOrder {
    id: string
    total: number
    status: string
    customer_email: string
    customer_name: string
    tickets?: DatabaseTicket[]
}

interface DatabaseTicket {
    id: string
    status: string
    check_in_time?: string
    created_at: string
    attendee_name?: string
    attendee_email?: string
    confirmation_code: string
    orders: DatabaseOrder | DatabaseOrder[]
    ticket_types: DatabaseTicketType | DatabaseTicketType[]
    events: DatabaseEvent | DatabaseEvent[]
}

// CSV export data interfaces
interface AttendeeExportRow {
    'Name': string
    'Email': string
    'Type': string
    'Event': string
    'Event Date': string
    'Event Location': string
    'Status': string
    'Ticket Type': string
    'Ticket Price': string
    'Registration Date': string
    'Check-in Status': string
    'Check-in Time': string
    'Confirmation Code': string
    'Order ID': string
    'Order Total': string
    'Order Status': string
    'Attendee Count': number
    'User ID': string
    'Event ID': string
}

interface AnalyticsExportRow {
    'Event ID': string
    'Event Title': string
    'Event Date': string
    'Event Location': string
    'Total Attendees': number
    'Checked In': number
    'Check-in Rate': string
    'Total Revenue': string
    'RSVP Count': number
    'Ticket Count': number
}

interface EventExportRow {
    'Event ID': string
    'Title': string
    'Date': string
    'Time': string
    'Location': string
    'Total Attendees': number
    'Total Revenue': string
    'Ticket Types': string
    'Status': string
}

interface SummaryExportRow {
    'Metric': string
    'Value': string
}

type ExportRow = AttendeeExportRow | AnalyticsExportRow | EventExportRow | SummaryExportRow

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

        let csvData: ExportRow[] = []
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

async function exportAttendees(
    supabase: SupabaseClient,
    filters: Record<string, unknown>,
    userRole: string,
    userId: string
): Promise<AttendeeExportRow[]> {
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
    const attendeeData: AttendeeExportRow[] = []

    // Add RSVP attendees
    rsvps?.forEach((rsvp: any) => {
        // Handle events field (could be single object or array)
        const eventData = Array.isArray(rsvp.events) ? rsvp.events[0] : rsvp.events
        // Handle users field (could be single object or array)  
        const userData = Array.isArray(rsvp.users) ? rsvp.users?.[0] : rsvp.users

        attendeeData.push({
            'Name': userData?.display_name || rsvp.guest_name || 'Unknown',
            'Email': userData?.email || rsvp.guest_email || 'Unknown',
            'Type': 'Free RSVP',
            'Event': eventData?.title || 'Unknown',
            'Event Date': eventData?.start_time ? new Date(eventData.start_time).toLocaleDateString() : 'Unknown',
            'Event Location': eventData?.location || 'Not specified',
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
            'User ID': userData?.id || '',
            'Event ID': eventData?.id || ''
        })
    })

    // Add ticket attendees
    tickets?.forEach((ticket: any) => {
        // Handle related fields (could be single objects or arrays)
        const orderData = Array.isArray(ticket.orders) ? ticket.orders[0] : ticket.orders
        const ticketTypeData = Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types
        const eventData = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events

        attendeeData.push({
            'Name': ticket.attendee_name || orderData?.customer_name || 'Unknown',
            'Email': ticket.attendee_email || orderData?.customer_email || 'Unknown',
            'Type': 'Paid Ticket',
            'Event': eventData?.title || 'Unknown',
            'Event Date': eventData?.start_time ? new Date(eventData.start_time).toLocaleDateString() : 'Unknown',
            'Event Location': eventData?.location || 'Not specified',
            'Status': ticket.status,
            'Ticket Type': ticketTypeData?.name || 'Unknown',
            'Ticket Price': ticketTypeData?.price ? `$${(ticketTypeData.price / 100).toFixed(2)}` : 'Unknown',
            'Registration Date': new Date(ticket.created_at).toLocaleDateString(),
            'Check-in Status': ticket.check_in_time ? 'Checked In' : 'Not Checked In',
            'Check-in Time': ticket.check_in_time ? new Date(ticket.check_in_time).toLocaleDateString() : '',
            'Confirmation Code': ticket.confirmation_code || '',
            'Order ID': orderData?.id || '',
            'Order Total': orderData?.total ? `$${(orderData.total / 100).toFixed(2)}` : '',
            'Order Status': orderData?.status || '',
            'Attendee Count': 1,
            'User ID': '',
            'Event ID': eventData?.id || ''
        })
    })

    return attendeeData
}

async function exportAnalytics(
    supabase: SupabaseClient,
    filters: Record<string, unknown>,
    userRole: string,
    userId: string
): Promise<AnalyticsExportRow[]> {
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
      location,
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
            'Event Location': event.location || 'Not specified',
            'Total Attendees': totalAttendees,
            'Checked In': checkedInCount,
            'Check-in Rate': totalAttendees > 0 ? `${((checkedInCount / totalAttendees) * 100).toFixed(1)}%` : '0%',
            'Total Revenue': `$${(revenue / 100).toFixed(2)}`,
            'RSVP Count': (event.rsvps?.filter((rsvp: any) => rsvp.status === 'confirmed').length || 0),
            'Ticket Count': (event.orders?.filter((order: any) => order.status === 'completed').length || 0),
        }
    }) || []

    return analyticsData
}

async function exportEvents(
    supabase: SupabaseClient,
    filters: Record<string, unknown>,
    userRole: string,
    userId: string
): Promise<EventExportRow[]> {
    const { status, timeRange = 'all' } = filters

    let query = supabase
        .from('events')
        .select(`
      id,
      title,
      start_time,
      location,
      status,
      capacity,
      rsvps(id, status),
      orders(id, total, status),
      ticket_types(id, name, price)
    `)

    if (status) query = query.eq('status', status)
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

        const revenue = event.orders
            ?.filter((order: any) => order.status === 'completed')
            ?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0

        const ticketTypes = event.ticket_types?.map((tt: any) => `${tt.name} ($${(tt.price / 100).toFixed(2)})`).join(', ') || 'Free Event'

        return {
            'Event ID': event.id,
            'Title': event.title,
            'Date': new Date(event.start_time).toLocaleDateString(),
            'Time': new Date(event.start_time).toLocaleTimeString(),
            'Location': event.location || 'Not specified',
            'Total Attendees': totalAttendees,
            'Total Revenue': `$${(revenue / 100).toFixed(2)}`,
            'Ticket Types': ticketTypes,
            'Status': event.status || 'active'
        }
    }) || []

    return eventData
}

async function exportSummary(
    _supabase: SupabaseClient,
    _filters: Record<string, unknown>
): Promise<SummaryExportRow[]> {
    // This would contain high-level summary metrics
    // Implementation depends on specific requirements
    return [
        { 'Metric': 'Total Events', 'Value': '0' },
        { 'Metric': 'Total Attendees', 'Value': '0' },
        { 'Metric': 'Total Revenue', 'Value': '$0.00' }
    ]
}

function generateCSV(data: ExportRow[]): string {
    if (!data || data.length === 0) {
        return 'No data available for export'
    }

    // Get headers from the first item
    const headers = Object.keys(data[0])
    const rows = [headers]

    data.forEach((item: ExportRow) => {
        const row = headers.map(header => {
            const value: string | number | unknown = item[header as keyof ExportRow]
            // Escape commas and quotes in CSV values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
            }
            return String(value || '')
        })
        rows.push(row)
    })

    return rows.map(row => row.join(',')).join('\n')
} 