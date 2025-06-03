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

// Define TicketType interface for type safety
interface TicketType {
    id: string;
    event_id: string;
    name: string;
    description: string;
    price: number;
    capacity: number;
    sold_count: number;
    sort_order: number;
    sale_start: string | null;
    sale_end: string | null;
    created_at: string;
    updated_at: string;
    events: {
        id: string;
        title: string;
        description: string;
        is_open_for_registration: boolean;
        start_time: string;
        end_time: string;
        location: string;
        timezone: string;
    };
}

// Sample ticket types for development/demo events
function getSampleTicketTypes(eventId: string) {
    const sampleTickets: { [key: string]: TicketType[] } = {
        // Event 7: Startup Pitch Night (paid)
        'a0ddf64f-cf33-8a49-eccf-7379c9aab046': [
            {
                id: 'a1b2c3d4-e5f6-4789-a123-456789abcdef',
                event_id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046',
                name: 'General Admission',
                description: 'Access to networking event, light refreshments included',
                price: 2000, // $20.00 in cents
                capacity: 100,
                sold_count: 15,
                sort_order: 1,
                sale_start: null,
                sale_end: null,
                created_at: '2024-01-15T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
                events: {
                    id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046',
                    title: 'Startup Pitch Night',
                    description: 'Local entrepreneurs present their startup ideas to a panel of investors and community members.',
                    is_open_for_registration: true,
                    start_time: '2025-06-15T18:00:00.000Z',
                    end_time: '2025-06-15T21:00:00.000Z',
                    location: 'Innovation Hub',
                    timezone: 'America/New_York'
                }
            },
            {
                id: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
                event_id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046',
                name: 'Investor Pass',
                description: 'Premium networking with dedicated investor meetup session and priority seating',
                price: 7500, // $75.00 in cents
                capacity: 25,
                sold_count: 8,
                sort_order: 2,
                sale_start: null,
                sale_end: null,
                created_at: '2024-01-15T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
                events: {
                    id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046',
                    title: 'Startup Pitch Night',
                    description: 'Local entrepreneurs present their startup ideas to a panel of investors and community members.',
                    is_open_for_registration: true,
                    start_time: '2025-06-15T18:00:00.000Z',
                    end_time: '2025-06-15T21:00:00.000Z',
                    location: 'Innovation Hub',
                    timezone: 'America/New_York'
                }
            }
        ],
        // Event 9: Food Truck Festival (paid)
        'c2fff861-e155-ac6b-0eda-959ba1bcd268': [
            {
                id: 'a1b2c3d4-e5f6-4789-a123-456789abcdef',
                event_id: 'c2fff861-e155-ac6b-0eda-959ba1bcd268',
                name: 'Festival Entry',
                description: 'Access to festival grounds and all activities',
                price: 1500, // $15.00 in cents
                capacity: 200,
                sold_count: 25,
                sort_order: 1,
                sale_start: null,
                sale_end: null,
                created_at: '2024-01-15T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
                events: {
                    id: 'c2fff861-e155-ac6b-0eda-959ba1bcd268',
                    title: 'Food Truck Festival',
                    description: 'Annual food truck festival featuring 15+ local food vendors, live music, and family activities.',
                    is_open_for_registration: true,
                    start_time: '2025-06-15T16:00:00.000Z',
                    end_time: '2025-06-15T23:00:00.000Z',
                    location: 'Downtown Square',
                    timezone: 'America/New_York'
                }
            },
            {
                id: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
                event_id: 'c2fff861-e155-ac6b-0eda-959ba1bcd268',
                name: 'VIP Package',
                description: 'Premium access with reserved seating and complimentary drinks',
                price: 3500, // $35.00 in cents
                capacity: 50,
                sold_count: 25,
                sort_order: 2,
                sale_start: null,
                sale_end: null,
                created_at: '2024-01-15T00:00:00Z',
                updated_at: '2024-01-15T00:00:00Z',
                events: {
                    id: 'c2fff861-e155-ac6b-0eda-959ba1bcd268',
                    title: 'Food Truck Festival',
                    description: 'Annual food truck festival featuring 15+ local food vendors, live music, and family activities.',
                    is_open_for_registration: true,
                    start_time: '2025-06-15T16:00:00.000Z',
                    end_time: '2025-06-15T23:00:00.000Z',
                    location: 'Downtown Square',
                    timezone: 'America/New_York'
                }
            }
        ]
    }

    return sampleTickets[eventId] || []
}

// POST /api/checkout - Create PaymentIntent and prepare checkout session
export async function POST(request: NextRequest) {
    try {
        console.log('[DEBUG] STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length || 0);
        console.log('[DEBUG] STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) || 'NOT_FOUND');

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
        console.log('[DEBUG] Requested ticket type IDs:', ticketTypeIds);
        console.log('[DEBUG] Event ID:', event_id);

        // Try to get sample data first (for demo events)
        const sampleTicketTypes = getSampleTicketTypes(event_id);
        console.log('[DEBUG] Found sample ticket types:', sampleTicketTypes.length);
        console.log('[DEBUG] Sample ticket IDs:', sampleTicketTypes.map(tt => tt.id));

        let ticketTypes: TicketType[] = [];
        let ticketTypesError = null;

        if (sampleTicketTypes.length > 0) {
            // Use sample data and filter by requested ticket type IDs
            ticketTypes = sampleTicketTypes.filter(tt => ticketTypeIds.includes(tt.id));
            console.log('[DEBUG] Filtered ticket types found:', ticketTypes.length);
            console.log('[DEBUG] Filtered ticket IDs:', ticketTypes.map(tt => tt.id));
        } else {
            // Fall back to database query for real events
            const { data, error } = await supabase
                .from('ticket_types')
                .select(`
                    *,
                    events (
                        id,
                        title,
                        description,
                        is_open_for_registration,
                        start_time,
                        end_time,
                        location,
                        timezone
                    )
                `)
                .in('id', ticketTypeIds)
                .eq('event_id', event_id);

            ticketTypes = data || [];
            ticketTypesError = error;
        }

        if (ticketTypesError || !ticketTypes || ticketTypes.length !== ticketTypeIds.length) {
            console.log('[DEBUG] Validation failed:');
            console.log('[DEBUG] - ticketTypesError:', ticketTypesError);
            console.log('[DEBUG] - ticketTypes length:', ticketTypes?.length);
            console.log('[DEBUG] - expected length:', ticketTypeIds.length);
            return NextResponse.json(
                { error: 'Some ticket types were not found or are invalid' },
                { status: 404 }
            );
        }

        console.log('[DEBUG] ✅ Ticket validation passed, proceeding with event validation...');

        // Check if event is open for registration
        const event = ticketTypes[0]?.events;
        console.log('[DEBUG] Event data:', event);
        if (!event?.is_open_for_registration) {
            console.log('[DEBUG] ❌ Event registration is closed');
            return NextResponse.json(
                { error: 'Event registration is closed' },
                { status: 400 }
            );
        }

        console.log('[DEBUG] ✅ Event registration is open, checking start time...');

        // Check if event hasn't started
        if (new Date(event.start_time) <= new Date()) {
            console.log('[DEBUG] ❌ Event has already started');
            return NextResponse.json(
                { error: 'Cannot purchase tickets for events that have already started' },
                { status: 400 }
            );
        }

        console.log('[DEBUG] ✅ Event timing is valid, calculating totals...');

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
        console.log('[DEBUG] Creating Stripe PaymentIntent with:', {
            amount: total,
            currency: 'usd',
            customer: stripeCustomerId,
            metadata_keys: Object.keys({
                event_id,
                user_id: user?.id || 'guest',
                ticket_items: JSON.stringify(ticketItems.map(item => ({
                    ticket_type_id: item.ticket_type_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))),
                customer_email: customer_info?.email || user?.email || '',
                customer_name: customer_info?.name || '',
            })
        });

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

        console.log('[DEBUG] ✅ Stripe PaymentIntent created successfully:', paymentIntent.id);

        // Store pending order in database (optional - for order tracking)
        // TODO: Uncomment when pending_orders table is created in database
        /*
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
        */
        // const pendingOrder = null; // Temporary fallback - removed as not used

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
                title: event.title,
                description: event.description,
                start_time: event.start_time,
                end_time: event.end_time,
                location: event.location,
                timezone: event.timezone
            },
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
} 