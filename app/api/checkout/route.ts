import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Initialize Stripe with proper error handling
const getStripeInstance = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    console.log('[DEBUG] STRIPE_SECRET_KEY length:', secretKey.length)
    console.log('[DEBUG] STRIPE_SECRET_KEY starts with:', secretKey.substring(0, 16))

    return new Stripe(secretKey, {
        apiVersion: '2025-05-28.basil',
    })
}

interface TicketItem {
    ticket_type_id: string
    quantity: number
}

interface CustomerInfo {
    email: string
    name: string
}

interface CheckoutRequest {
    event_id: string
    tickets: TicketItem[]
    customer_info: CustomerInfo
}

interface TicketType {
    id: string
    event_id: string
    name: string
    price: number
    capacity?: number
    sold_count?: number
}

export async function POST(request: NextRequest) {
    try {
        const body: CheckoutRequest = await request.json()
        const { event_id, tickets: ticketItems, customer_info } = body

        console.log('[DEBUG] Received checkout request:', {
            event_id,
            tickets_count: ticketItems?.length,
            customer_info_present: !!customer_info
        })

        console.log('[DEBUG] Original event ID:', event_id)
        console.log('[DEBUG] Requested ticket type IDs:', ticketItems.map(t => t.ticket_type_id))

        // Initialize Supabase client
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Validate and fetch ticket types from database
        const { data: ticketTypes, error: ticketTypesError } = await supabase
            .from('ticket_types')
            .select('*')
            .in('id', ticketItems.map(item => item.ticket_type_id))
            .eq('event_id', event_id)

        if (ticketTypesError) {
            console.error('Database error fetching ticket types:', ticketTypesError)
            return NextResponse.json({ error: 'Failed to fetch ticket types' }, { status: 500 })
        }

        if (!ticketTypes || ticketTypes.length === 0) {
            return NextResponse.json({ error: 'No valid ticket types found' }, { status: 400 })
        }

        console.log('[DEBUG] ✅ Ticket validation passed, proceeding with event validation...')

        // Validate event exists and is available
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', event_id)
            .eq('published', true)
            .eq('cancelled', false)
            .single()

        if (eventError || !eventData) {
            console.error('Event validation failed:', eventError)
            return NextResponse.json({ error: 'Event not found or not available' }, { status: 400 })
        }

        console.log('[DEBUG] Event data:', eventData)

        // Check if event is in the future
        const eventStart = new Date(eventData.start_time)
        const now = new Date()
        if (eventStart <= now) {
            return NextResponse.json({ error: 'Cannot purchase tickets for past events' }, { status: 400 })
        }

        console.log('[DEBUG] ✅ Event timing is valid, calculating totals...')

        // Calculate total amount
        let total = 0
        for (const item of ticketItems) {
            const ticketType = (ticketTypes as TicketType[]).find((tt: TicketType) => tt.id === item.ticket_type_id)
            if (!ticketType) {
                return NextResponse.json({ error: `Invalid ticket type: ${item.ticket_type_id}` }, { status: 400 })
            }
            total += ticketType.price * item.quantity
        }

        // Add processing fee (3% + $0.30)
        const processingFee = Math.round(total * 0.03 + 30)
        total += processingFee

        // Initialize Stripe
        const stripe = getStripeInstance()

        // Get or create Stripe customer
        let stripeCustomerId: string

        if (user) {
            // Check if user already has a Stripe customer ID
            const { data: userData } = await supabase
                .from('users')
                .select('stripe_customer_id')
                .eq('id', user.id)
                .single()

            if (userData?.stripe_customer_id) {
                stripeCustomerId = userData.stripe_customer_id
            } else {
                // Create new Stripe customer for registered user
                const customer = await stripe.customers.create({
                    email: user.email || customer_info.email,
                    name: customer_info.name,
                    metadata: {
                        user_id: user.id
                    }
                })
                stripeCustomerId = customer.id

                // Save Stripe customer ID to user profile
                await supabase
                    .from('users')
                    .update({ stripe_customer_id: stripeCustomerId })
                    .eq('id', user.id)
            }
        } else {
            // Create Stripe customer for guest checkout
            const customer = await stripe.customers.create({
                email: customer_info.email,
                name: customer_info.name,
                metadata: {
                    checkout_type: 'guest'
                }
            })
            stripeCustomerId = customer.id
        }

        console.log('[DEBUG] Creating Stripe PaymentIntent with:', {
            amount: total,
            currency: 'usd',
            customer: stripeCustomerId,
            metadata_keys: [
                'event_id',
                'user_id',
                'ticket_items',
                'customer_email',
                'customer_name'
            ]
        })

        // Create PaymentIntent with fixed Stripe configuration
        const paymentIntent = await stripe.paymentIntents.create({
            amount: total,
            currency: 'usd',
            customer: stripeCustomerId,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                event_id,
                user_id: user?.id || 'guest',
                ticket_items: JSON.stringify(ticketItems.map(item => {
                    const ticketType = (ticketTypes as TicketType[]).find((tt: TicketType) => tt.id === item.ticket_type_id)
                    return {
                        ticket_type_id: item.ticket_type_id,
                        quantity: item.quantity,
                        unit_price: ticketType?.price || 0
                    }
                })),
                customer_email: customer_info?.email || user?.email || '',
                customer_name: customer_info?.name || '',
            }
        })

        console.log('[DEBUG] ✅ Stripe PaymentIntent created successfully:', paymentIntent.id)

        // Return complete response structure that frontend expects
        return NextResponse.json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            amount: total,
            currency: 'usd',
            event: {
                id: eventData.id,
                title: eventData.title,
                location: eventData.location,
                start_time: eventData.start_time,
                end_time: eventData.end_time,
                timezone: eventData.timezone
            },
            ticket_items: ticketItems.map(item => {
                const ticketType = (ticketTypes as TicketType[]).find((tt: TicketType) => tt.id === item.ticket_type_id)
                return {
                    ticket_type_id: item.ticket_type_id,
                    quantity: item.quantity,
                    unit_price: ticketType?.price || 0,
                    total_price: (ticketType?.price || 0) * item.quantity,
                    name: ticketType?.name || 'Ticket'
                }
            }),
            customer_info,
            total_amount: total
        })

    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        )
    }
} 