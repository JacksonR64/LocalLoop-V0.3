import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyWebhookSignature } from '@/lib/stripe'
import { sendTicketConfirmationEmail } from '@/lib/emails/send-ticket-confirmation'

export async function POST(request: NextRequest) {
    const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🔔 [${webhookId}] Webhook received at ${new Date().toISOString()}`)

    try {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        console.log('[DEBUG] Webhook received:', {
            signature_present: !!signature,
            body_length: body.length,
            content_type: request.headers.get('content-type')
        });

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
                { error: 'Webhook secret not configured' },
                { status: 500 }
            )
        }

        let event: Stripe.Event;

        try {
            event = verifyWebhookSignature(body, signature, webhookSecret)
            console.log('✅ Webhook signature verified successfully:', event.type)
        } catch (verificationError) {
            console.error('❌ Webhook signature verification failed:', verificationError)

            // For development mode, let's try to parse the event anyway if it's from Stripe CLI
            // This is a fallback for testing purposes only
            if (process.env.NODE_ENV === 'development' && signature.includes('stripe-signature')) {
                try {
                    console.log('🔄 Attempting to parse webhook without verification (DEV MODE)')
                    event = JSON.parse(body) as Stripe.Event;
                    console.log('⚠️ Using unverified webhook event in development:', event.type)
                } catch (parseError) {
                    console.error('❌ Failed to parse webhook body:', parseError)
                    return NextResponse.json(
                        { error: 'Invalid webhook signature and body' },
                        { status: 400 }
                    )
                }
            } else {
                return NextResponse.json(
                    { error: 'Invalid webhook signature' },
                    { status: 400 }
                )
            }
        }

        const supabase = await createServerSupabaseClient()

        switch (event.type) {
            case 'payment_intent.succeeded': {
                try {
                    const paymentIntent = event.data.object
                    console.log(`💰 [${webhookId}] Payment succeeded: ${paymentIntent.id}`)
                    console.log(`📊 [${webhookId}] Received metadata:`, JSON.stringify(paymentIntent.metadata, null, 2))

                    // Log the complete PaymentIntent object structure for debugging
                    console.log('[DEBUG] Full PaymentIntent keys:', Object.keys(paymentIntent))
                    console.log('[DEBUG] PaymentIntent.metadata type:', typeof paymentIntent.metadata)
                    console.log('[DEBUG] PaymentIntent.metadata is null/undefined:', paymentIntent.metadata == null)

                    // Check if metadata exists at all
                    if (!paymentIntent.metadata || Object.keys(paymentIntent.metadata).length === 0) {
                        console.error('❌ No metadata found in PaymentIntent')
                        return NextResponse.json({ error: 'Missing metadata in payment intent' }, { status: 400 })
                    }

                    // Validate all required metadata fields exist
                    const requiredFields = ['event_id', 'user_id', 'ticket_items', 'customer_email', 'customer_name']
                    const missingFields = requiredFields.filter(field => !paymentIntent.metadata[field])

                    if (missingFields.length > 0) {
                        console.error('❌ Missing required metadata fields:', missingFields)
                        return NextResponse.json({
                            error: 'Missing required metadata fields',
                            missing_fields: missingFields
                        }, { status: 400 })
                    }

                    // Extract metadata values
                    const { event_id, user_id, ticket_items, customer_email, customer_name } = paymentIntent.metadata
                    console.log('Extracted metadata values:', {
                        event_id,
                        user_id,
                        ticket_items: ticket_items ? 'Present' : 'Missing',
                        customer_email,
                        customer_name
                    })

                    // Parse ticket items from JSON string
                    let parsedTicketItems: Array<{
                        ticket_type_id: string
                        quantity: number
                        unit_price: number
                    }>
                    try {
                        parsedTicketItems = JSON.parse(ticket_items)
                        console.log('✅ Parsed ticket items:', parsedTicketItems)
                    } catch (error) {
                        console.error('❌ Failed to parse ticket_items JSON:', error)
                        return NextResponse.json({ error: 'Invalid ticket_items format in metadata' }, { status: 400 })
                    }

                    console.log('🔄 Creating order record...')

                    // Check if order already exists for this payment intent (duplicate prevention)
                    const { data: existingOrder, error: checkError } = await supabase
                        .from('orders')
                        .select('id, status, created_at')
                        .eq('stripe_payment_intent_id', paymentIntent.id)
                        .single()

                    if (checkError && checkError.code !== 'PGRST116') {
                        console.error('❌ Error checking for existing order:', checkError)
                        return NextResponse.json(
                            { error: 'Failed to check existing order', details: checkError.message },
                            { status: 500 }
                        )
                    }

                    if (existingOrder) {
                        console.log(`🔄 [${webhookId}] Order already exists for payment intent ${paymentIntent.id}:`, {
                            orderId: existingOrder.id,
                            status: existingOrder.status,
                            createdAt: existingOrder.created_at
                        })

                        const processingTime = Date.now() - startTime
                        console.log(`⏱️ [${webhookId}] Duplicate processing avoided in ${processingTime}ms`)

                        // Return success since order already exists (idempotent behavior)
                        return NextResponse.json({
                            received: true,
                            message: 'Order already processed',
                            webhookId,
                            processingTime,
                            orderId: existingOrder.id
                        })
                    }

                    // Create order record first
                    const { data: orderData, error: orderError } = await supabase
                        .from('orders')
                        .insert({
                            event_id,
                            user_id: user_id && user_id !== 'guest' ? user_id : null,
                            guest_email: user_id === 'guest' ? customer_email : null,
                            guest_name: user_id === 'guest' ? customer_name : null,
                            total_amount: paymentIntent.amount,
                            currency: paymentIntent.currency,
                            stripe_payment_intent_id: paymentIntent.id,
                            status: 'completed'
                        })
                        .select()
                        .single()

                    if (orderError) {
                        console.error('❌ Failed to create order:', orderError)
                        console.error('❌ Order error details:', JSON.stringify(orderError, null, 2))

                        // Specific handling for constraint violations
                        if (orderError.code === '23514') {
                            console.error('💡 Database constraint violation - likely duplicate webhook processing')
                            console.error('💡 Payment Intent ID:', paymentIntent.id)
                            console.error('💡 Attempted status:', 'completed')

                            // Check if order was created by another webhook call
                            const { data: duplicateCheck } = await supabase
                                .from('orders')
                                .select('id, status')
                                .eq('stripe_payment_intent_id', paymentIntent.id)
                                .single()

                            if (duplicateCheck) {
                                console.log('💡 Found existing order after constraint violation:', duplicateCheck)
                                return NextResponse.json({
                                    received: true,
                                    message: 'Order created by concurrent webhook',
                                    orderId: duplicateCheck.id
                                })
                            }
                        }

                        return NextResponse.json(
                            { error: 'Failed to create order record', details: orderError.message },
                            { status: 500 }
                        )
                    }

                    console.log('✅ Created order:', orderData.id)

                    console.log('🔄 Creating tickets...')
                    // Create tickets in database
                    const ticketsToCreate = []
                    for (const item of parsedTicketItems) {
                        for (let i = 0; i < item.quantity; i++) {
                            ticketsToCreate.push({
                                order_id: orderData.id,
                                ticket_type_id: item.ticket_type_id,
                                event_id,
                                user_id: user_id && user_id !== 'guest' ? user_id : null,
                                customer_email: customer_email || null,
                                customer_name: customer_name || null,
                                attendee_email: customer_email || null,
                                attendee_name: customer_name || null,
                                unit_price: item.unit_price,
                                purchase_price: item.unit_price, // Keep both for compatibility
                                quantity: 1, // Each ticket is quantity 1
                                status: 'active',
                                confirmation_code: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                            })
                        }
                    }

                    console.log('🔄 Inserting tickets into database:', ticketsToCreate.length, 'tickets')
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
                        console.error('❌ Failed to create tickets:', ticketError)
                        console.error('❌ Ticket error details:', JSON.stringify(ticketError, null, 2))
                        console.error('❌ Tickets data that failed:', JSON.stringify(ticketsToCreate, null, 2))
                        return NextResponse.json(
                            { error: 'Failed to create tickets', details: ticketError.message },
                            { status: 500 }
                        )
                    }

                    console.log(`✅ Created ${createdTickets?.length || 0} tickets for order ${orderData.id}`)

                    // Send confirmation email
                    if (customer_email && createdTickets && createdTickets.length > 0) {
                        try {
                            console.log('🔄 Sending confirmation email...')
                            const event = createdTickets[0].ticket_types.events
                            interface TicketGroup {
                                ticket_type: {
                                    name: string
                                    description: string
                                }
                                tickets: Array<{
                                    id: string
                                    ticket_type_id: string
                                    unit_price: number
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
                                    totalPaid: group.tickets.reduce((sum: number, ticket) => sum + ticket.unit_price, 0)
                                })),
                                totalPaid: paymentIntent.amount,
                                paymentIntentId: paymentIntent.id,
                                ticketIds: createdTickets.map(t => t.id)
                            })

                            console.log('✅ Confirmation email sent successfully')
                        } catch (emailError) {
                            console.error('❌ Failed to send confirmation email:', emailError)
                            // Don't fail the webhook for email errors
                        }
                    }

                    console.log(`✅ [${webhookId}] Successfully processed payment ${paymentIntent.id}: created order ${orderData.id} with ${createdTickets?.length || 0} tickets`)

                    const processingTime = Date.now() - startTime
                    console.log(`⏱️ [${webhookId}] Processing completed in ${processingTime}ms`)

                    return NextResponse.json({
                        received: true,
                        webhookId,
                        processingTime,
                        orderId: orderData.id,
                        ticketCount: createdTickets?.length || 0
                    })
                } catch (error) {
                    console.error('❌ Webhook processing error:', error)
                    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
                    return NextResponse.json(
                        { error: 'Webhook handler failed', details: error instanceof Error ? error.message : 'Unknown error' },
                        { status: 500 }
                    )
                }
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object
                console.log('Payment failed:', paymentIntent.id)

                // Try to update order status if it exists
                await supabase
                    .from('orders')
                    .update({
                        status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_payment_intent_id', paymentIntent.id)

                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('❌ Webhook error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}