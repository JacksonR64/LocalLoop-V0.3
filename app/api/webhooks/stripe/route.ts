import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyWebhookSignature } from '@/lib/stripe'
import { sendTicketConfirmationEmail } from '@/lib/emails/send-ticket-confirmation'

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            )
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not configured')
            return NextResponse.json(
                { error: 'Webhook configuration error' },
                { status: 500 }
            )
        }

        // Verify webhook signature
        let event
        try {
            event = verifyWebhookSignature(body, signature, webhookSecret)
        } catch (error) {
            console.error('Webhook signature verification failed:', error)
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabaseClient()

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object
                console.log('Payment succeeded:', paymentIntent.id)

                // Extract metadata
                const {
                    event_id,
                    user_id,
                    ticket_items,
                    customer_email,
                    customer_name
                } = paymentIntent.metadata

                if (!event_id || !ticket_items) {
                    console.error('Missing required metadata in payment intent')
                    return NextResponse.json({ received: true })
                }

                let parsedTicketItems
                try {
                    parsedTicketItems = JSON.parse(ticket_items)
                } catch (error) {
                    console.error('Failed to parse ticket_items metadata:', error)
                    return NextResponse.json({ received: true })
                }

                // Create tickets in database
                const ticketsToCreate = []
                for (const item of parsedTicketItems) {
                    for (let i = 0; i < item.quantity; i++) {
                        ticketsToCreate.push({
                            ticket_type_id: item.ticket_type_id,
                            event_id,
                            user_id: user_id && user_id !== 'guest' ? user_id : null,
                            customer_email: customer_email || null,
                            customer_name: customer_name || null,
                            purchase_price: item.unit_price,
                            payment_intent_id: paymentIntent.id,
                            status: 'active',
                        })
                    }
                }

                const { data: createdTickets, error: ticketError } = await supabase
                    .from('tickets')
                    .insert(ticketsToCreate)
                    .select(`
                        *,
                        ticket_types (
                            name,
                            description,
                            events (
                                title,
                                start_time,
                                end_time,
                                location
                            )
                        )
                    `)

                if (ticketError) {
                    console.error('Failed to create tickets:', ticketError)
                    return NextResponse.json(
                        { error: 'Failed to create tickets' },
                        { status: 500 }
                    )
                }

                // Update pending order status if it exists
                await supabase
                    .from('pending_orders')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        ticket_ids: createdTickets?.map(t => t.id) || []
                    })
                    .eq('payment_intent_id', paymentIntent.id)

                // Send confirmation email
                if (customer_email && createdTickets && createdTickets.length > 0) {
                    try {
                        const event = createdTickets[0].ticket_types.events
                        interface TicketGroup {
                            ticket_type: {
                                name: string
                                description: string
                            }
                            tickets: Array<{
                                id: string
                                ticket_type_id: string
                                purchase_price: number
                            }>
                        }

                        const ticketGroups = createdTickets.reduce((groups, ticket) => {
                            const typeId = ticket.ticket_type_id
                            if (!groups[typeId]) {
                                groups[typeId] = {
                                    ticket_type: ticket.ticket_types,
                                    tickets: []
                                }
                            }
                            groups[typeId].tickets.push(ticket)
                            return groups
                        }, {} as Record<string, TicketGroup>)

                        await sendTicketConfirmationEmail({
                            to: customer_email,
                            customerName: customer_name || 'Customer',
                            eventTitle: event.title,
                            eventDate: event.start_time,
                            eventTime: `${new Date(event.start_time).toLocaleTimeString()} - ${new Date(event.end_time).toLocaleTimeString()}`,
                            eventLocation: event.location,
                            tickets: (Object.values(ticketGroups) as TicketGroup[]).map((group) => ({
                                ticketType: group.ticket_type.name,
                                quantity: group.tickets.length,
                                totalPaid: group.tickets.reduce((sum: number, ticket) => sum + ticket.purchase_price, 0)
                            })),
                            totalPaid: paymentIntent.amount,
                            paymentIntentId: paymentIntent.id,
                            ticketIds: createdTickets.map(t => t.id)
                        })
                    } catch (emailError) {
                        console.error('Failed to send confirmation email:', emailError)
                        // Don't fail the webhook for email errors
                    }
                }

                console.log(`Successfully created ${createdTickets?.length || 0} tickets for payment ${paymentIntent.id}`)
                break
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object
                console.log('Payment failed:', paymentIntent.id)

                // Update pending order status
                await supabase
                    .from('pending_orders')
                    .update({
                        status: 'failed',
                        failed_at: new Date().toISOString(),
                        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
                    })
                    .eq('payment_intent_id', paymentIntent.id)

                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
} 