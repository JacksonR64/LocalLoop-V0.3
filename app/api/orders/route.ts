import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Define proper types for the orders response
interface OrderWithRelations {
    id: string
    created_at: string
    updated_at: string
    event_id: string
    status: string
    total_amount: number
    currency: string
    refunded_at: string | null
    refund_amount: number | null
    is_refundable: boolean
    net_amount: number
    tickets_count: number
    calendar_integration_status: string | null
    stripe_payment_intent_id: string | null
    guest_email?: string
    guest_name?: string
    events: {
        id: string
        title: string
        description: string | null
        start_time: string
        end_time: string
        location: string
        slug: string
        cancelled: boolean
    } | null
    tickets: Array<{
        id: string
        quantity: number
        unit_price: number
        total_price: number
        attendee_name: string
        attendee_email: string
        confirmation_code: string
        check_in_time: string | null
        is_valid: boolean
        ticket_types: {
            id: string
            name: string
            description: string | null
        } | null
    }>
}

/**
 * GET /api/orders
 * Fetch orders for the authenticated user
 * Returns orders with tickets, event details, and refund eligibility
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get orders for the user with all related data
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                updated_at,
                event_id,
                status,
                total_amount,
                currency,
                refunded_at,
                refund_amount,
                stripe_payment_intent_id,
                events (
                    id,
                    title,
                    description,
                    start_time,
                    end_time,
                    location,
                    slug,
                    cancelled
                ),
                tickets (
                    id,
                    quantity,
                    unit_price,
                    attendee_name,
                    attendee_email,
                    confirmation_code,
                    check_in_time,
                    ticket_types (
                        id,
                        name,
                        description
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (ordersError) {
            console.error('Error fetching orders:', ordersError)
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            )
        }

        // Also get guest orders by email if user has email
        let guestOrders: any[] = []
        if (user.email) {
            const { data: guestOrdersData, error: guestOrdersError } = await supabase
                .from('orders')
                .select(`
                    id,
                    created_at,
                    updated_at,
                    event_id,
                    status,
                    total_amount,
                    currency,
                    refunded_at,
                    refund_amount,
                    stripe_payment_intent_id,
                    guest_email,
                    guest_name,
                    events (
                        id,
                        title,
                        description,
                        start_time,
                        end_time,
                        location,
                        slug,
                        cancelled
                    ),
                    tickets (
                        id,
                        quantity,
                        unit_price,
                        attendee_name,
                        attendee_email,
                        confirmation_code,
                        check_in_time,
                        ticket_types (
                            id,
                            name,
                            description
                        )
                    )
                `)
                .eq('guest_email', user.email)
                .is('user_id', null)
                .order('created_at', { ascending: false })

            if (!guestOrdersError && guestOrdersData) {
                guestOrders = guestOrdersData
            }
        }

        // Helper function to calculate computed values for orders
        const enrichOrderData = (order: any): OrderWithRelations => {
            const tickets = order.tickets || []
            
            // Calculate computed values
            const tickets_count = tickets.reduce((sum: number, ticket: any) => sum + (ticket.quantity || 0), 0)
            const is_refundable = order.status === 'completed' && !order.refunded_at && order.refund_amount === 0
            const net_amount = order.total_amount - (order.refund_amount || 0)
            const calendar_integration_status = order.added_to_google_calendar ? 'added' : 'pending'
            
            // Enrich tickets with computed values
            const enrichedTickets = tickets.map((ticket: any) => ({
                ...ticket,
                total_price: (ticket.unit_price || 0) * (ticket.quantity || 0),
                is_valid: !ticket.check_in_time && order.status === 'completed',
                ticket_types: Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types
            }))

            return {
                ...order,
                is_refundable,
                net_amount,
                tickets_count,
                calendar_integration_status,
                events: Array.isArray(order.events) ? order.events[0] : order.events,
                tickets: enrichedTickets
            }
        }

        // Transform and enrich both user orders and guest orders
        const transformedOrders = (orders || []).map(enrichOrderData)
        const transformedGuestOrders = guestOrders.map(enrichOrderData)

        const allOrders = [...transformedOrders, ...transformedGuestOrders]
        const uniqueOrders = allOrders.reduce((unique, order) => {
            const exists = unique.find((o: OrderWithRelations) => o.id === order.id)
            if (!exists) {
                unique.push(order)
            }
            return unique
        }, [] as OrderWithRelations[])

        // Sort by creation date (newest first)
        uniqueOrders.sort((a: OrderWithRelations, b: OrderWithRelations) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return NextResponse.json({
            orders: uniqueOrders,
            count: uniqueOrders.length
        })

    } catch (error) {
        console.error('Orders API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 