import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

// Checkout request schema
const checkoutSchema = z.object({
    tickets: z.array(z.object({
        ticket_type_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
    })),
    customer_info: z.object({
        email: z.string().email(),
        name: z.string().min(1).max(100),
        phone: z.string().optional(),
    }).optional(),
    event_id: z.string().uuid(),
    return_url: z.string().url().optional(),
});

// POST /api/checkout - Create PaymentIntent and prepare checkout session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = checkoutSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const { tickets, customer_info, event_id } = validationResult.data;
        const supabase = await createServerSupabaseClient();

        // Get user if authenticated
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch ticket types and validate availability
        const ticketTypeIds = tickets.map(t => t.ticket_type_id);
        const { data: ticketTypes, error: ticketTypesError } = await supabase
            .from('ticket_types')
            .select(`
                *,
                events (
                    id,
                    title,
                    is_open_for_registration,
                    start_time
                )
            `)
            .in('id', ticketTypeIds)
            .eq('event_id', event_id);

        if (ticketTypesError || !ticketTypes || ticketTypes.length !== ticketTypeIds.length) {
            return NextResponse.json(
                { error: 'Some ticket types were not found or are invalid' },
                { status: 404 }
            );
        }

        // Check if event is open for registration
        const event = ticketTypes[0]?.events;
        if (!event?.is_open_for_registration) {
            return NextResponse.json(
                { error: 'Event registration is closed' },
                { status: 400 }
            );
        }

        // Check if event hasn't started
        if (new Date(event.start_time) <= new Date()) {
            return NextResponse.json(
                { error: 'Cannot purchase tickets for events that have already started' },
                { status: 400 }
            );
        }

        // Validate ticket availability and calculate total
        let subtotal = 0;
        const ticketItems = [];

        for (const ticketRequest of tickets) {
            const ticketType = ticketTypes.find(tt => tt.id === ticketRequest.ticket_type_id);
            if (!ticketType) continue;

            // Check sale period
            const now = new Date();
            if (ticketType.sale_start && new Date(ticketType.sale_start) > now) {
                return NextResponse.json(
                    { error: `Sales for "${ticketType.name}" haven't started yet` },
                    { status: 400 }
                );
            }
            if (ticketType.sale_end && new Date(ticketType.sale_end) < now) {
                return NextResponse.json(
                    { error: `Sales for "${ticketType.name}" have ended` },
                    { status: 400 }
                );
            }

            // Check capacity if set
            if (ticketType.capacity) {
                const { data: soldTickets } = await supabase
                    .from('tickets')
                    .select('id')
                    .eq('ticket_type_id', ticketType.id);

                const soldCount = soldTickets?.length || 0;
                const availableCount = ticketType.capacity - soldCount;

                if (ticketRequest.quantity > availableCount) {
                    return NextResponse.json(
                        {
                            error: `Only ${availableCount} tickets available for "${ticketType.name}"`,
                            available_count: availableCount
                        },
                        { status: 400 }
                    );
                }
            }

            const itemTotal = ticketType.price * ticketRequest.quantity;
            subtotal += itemTotal;

            ticketItems.push({
                ticket_type_id: ticketType.id,
                ticket_type_name: ticketType.name,
                quantity: ticketRequest.quantity,
                unit_price: ticketType.price,
                total_price: itemTotal,
                ticket_type: ticketType
            });
        }

        if (subtotal === 0) {
            return NextResponse.json(
                { error: 'Free tickets should use the RSVP system instead' },
                { status: 400 }
            );
        }

        // Calculate total with fees (Stripe fee calculation)
        const stripeFee = Math.round(subtotal * 0.029) + 30; // 2.9% + 30 cents
        const total = subtotal + stripeFee;

        // Create or get Stripe customer
        let stripeCustomerId: string | undefined;
        if (customer_info?.email) {
            const existingCustomers = await stripe.customers.list({
                email: customer_info.email,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                stripeCustomerId = existingCustomers.data[0].id;
            } else {
                const newCustomer = await stripe.customers.create({
                    email: customer_info.email,
                    name: customer_info.name,
                    phone: customer_info.phone,
                    metadata: {
                        event_id,
                        user_id: user?.id || 'guest',
                    },
                });
                stripeCustomerId = newCustomer.id;
            }
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: total,
            currency: 'usd',
            customer: stripeCustomerId,
            metadata: {
                event_id,
                user_id: user?.id || 'guest',
                ticket_items: JSON.stringify(ticketItems.map(item => ({
                    ticket_type_id: item.ticket_type_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))),
                customer_email: customer_info?.email || user?.email || '',
                customer_name: customer_info?.name || '',
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Store pending order in database (optional - for order tracking)
        const { data: pendingOrder, error: orderError } = await supabase
            .from('pending_orders')
            .insert({
                payment_intent_id: paymentIntent.id,
                event_id,
                user_id: user?.id,
                customer_email: customer_info?.email || user?.email,
                customer_name: customer_info?.name,
                total_amount: total,
                subtotal_amount: subtotal,
                fee_amount: stripeFee,
                ticket_items: ticketItems,
                status: 'pending',
            })
            .select('id')
            .single();

        if (orderError) {
            console.warn('Failed to create pending order record:', orderError);
            // Don't fail the request for this
        }

        return NextResponse.json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            amount: total,
            subtotal: subtotal,
            fees: stripeFee,
            ticket_items: ticketItems.map(item => ({
                ticket_type_id: item.ticket_type_id,
                ticket_type_name: item.ticket_type_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price
            })),
            event: {
                id: event.id,
                title: event.title
            },
            order_id: pendingOrder?.id,
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
} 