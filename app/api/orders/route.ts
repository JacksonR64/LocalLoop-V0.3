import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/orders
 * Fetch orders for the authenticated user
 * Returns orders with tickets, event details, and refund eligibility
 */
export async function GET(request: NextRequest) {
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
                is_refundable,
                net_amount,
                tickets_count,
                calendar_integration_status,
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
                    total_price,
                    attendee_name,
                    attendee_email,
                    confirmation_code,
                    check_in_time,
                    is_valid,
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
                    is_refundable,
                    net_amount,
                    tickets_count,
                    calendar_integration_status,
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
                        total_price,
                        attendee_name,
                        attendee_email,
                        confirmation_code,
                        check_in_time,
                        is_valid,
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

        // Combine and deduplicate orders
        const allOrders = [...(orders || []), ...guestOrders]
        const uniqueOrders = allOrders.reduce((unique, order) => {
            const exists = unique.find(o => o.id === order.id)
            if (!exists) {
                unique.push(order)
            }
            return unique
        }, [] as any[])

        // Sort by creation date (newest first)
        uniqueOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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