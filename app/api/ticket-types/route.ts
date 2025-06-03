import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Ticket type creation schema
const ticketTypeSchema = z.object({
    event_id: z.string().uuid('Invalid event ID'),
    name: z.string().min(1, 'Ticket type name is required').max(100, 'Name must be 100 characters or less'),
    description: z.string().optional(),
    price: z.number().int().min(0, 'Price must be non-negative'), // in cents
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
    sort_order: z.number().int().min(0).default(0),
    sale_start: z.string().datetime().optional(),
    sale_end: z.string().datetime().optional(),
}).refine(
    (data) => {
        if (data.sale_start && data.sale_end) {
            return new Date(data.sale_start) < new Date(data.sale_end);
        }
        return true;
    },
    {
        message: "Sale start time must be before sale end time",
        path: ["sale_start"],
    }
);

// Sample ticket types for development/demo events
function getSampleTicketTypes(eventId: string) {
    interface SampleTicketType {
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
    }

    const sampleTickets: { [key: string]: SampleTicketType[] } = {
        // Event 2: Local Business Networking (paid)
        '2': [
            {
                id: 'ticket-2-1',
                event_id: '2',
                name: 'Standard Admission',
                description: 'Includes networking session, refreshments, and welcome packet',
                price: 2500, // $25.00 in cents
                capacity: 80,
                sold_count: 45,
                sort_order: 0,
                sale_start: '2025-01-15T00:00:00.000Z',
                sale_end: '2025-05-12T16:00:00.000Z',
                created_at: '2025-01-10T00:00:00.000Z',
                updated_at: '2025-01-10T00:00:00.000Z'
            },
            {
                id: 'ticket-2-2',
                event_id: '2',
                name: 'VIP Package',
                description: 'Priority networking, private speaker meet & greet, premium refreshments',
                price: 5000, // $50.00 in cents
                capacity: 20,
                sold_count: 8,
                sort_order: 1,
                sale_start: '2025-01-15T00:00:00.000Z',
                sale_end: '2025-05-12T16:00:00.000Z',
                created_at: '2025-01-10T00:00:00.000Z',
                updated_at: '2025-01-10T00:00:00.000Z'
            }
        ],

        // Event 3: Kids Art Workshop (paid)
        '3': [
            {
                id: 'ticket-3-1',
                event_id: '3',
                name: 'Child Participant',
                description: 'Workshop participation for one child (ages 6-12), includes all materials',
                price: 1500, // $15.00 in cents
                capacity: 18,
                sold_count: 8,
                sort_order: 0,
                sale_start: '2025-04-15T00:00:00.000Z',
                sale_end: '2025-05-20T13:00:00.000Z',
                created_at: '2025-04-01T00:00:00.000Z',
                updated_at: '2025-04-01T00:00:00.000Z'
            },
            {
                id: 'ticket-3-2',
                event_id: '3',
                name: 'Family Package',
                description: 'Workshop for up to 2 children plus 1 adult companion',
                price: 2500, // $25.00 in cents
                capacity: 5,
                sold_count: 2,
                sort_order: 1,
                sale_start: '2025-04-15T00:00:00.000Z',
                sale_end: '2025-05-20T13:00:00.000Z',
                created_at: '2025-04-01T00:00:00.000Z',
                updated_at: '2025-04-01T00:00:00.000Z'
            }
        ],

        // Event 7: Startup Pitch Night (paid) - FIXED TO MATCH NUMERIC ID
        '7': [
            {
                id: 'ticket-7-1',
                event_id: '7',
                name: 'General Admission',
                description: 'Access to presentations and networking session',
                price: 2000, // $20.00 in cents
                capacity: 100,
                sold_count: 67,
                sort_order: 0,
                sale_start: '2025-03-01T00:00:00.000Z',
                sale_end: '2025-06-24T16:00:00.000Z',
                created_at: '2025-02-15T00:00:00.000Z',
                updated_at: '2025-02-15T00:00:00.000Z'
            },
            {
                id: 'ticket-7-2',
                event_id: '7',
                name: 'Investor Pass',
                description: 'VIP seating, exclusive investor networking, and pitch deck access',
                price: 7500, // $75.00 in cents
                capacity: 20,
                sold_count: 12,
                sort_order: 1,
                sale_start: '2025-03-01T00:00:00.000Z',
                sale_end: '2025-06-24T16:00:00.000Z',
                created_at: '2025-02-15T00:00:00.000Z',
                updated_at: '2025-02-15T00:00:00.000Z'
            }
        ],

        // Event 9: Food Truck Festival (paid)
        '9': [
            {
                id: 'a1b2c3d4-e5f6-4789-a123-456789abcdef',
                event_id: '9',
                name: 'Festival Entry',
                description: 'Access to festival grounds and all activities',
                price: 1500, // $15.00 in cents
                capacity: 200,
                sold_count: 25,
                sort_order: 1,
                sale_start: null,
                sale_end: null,
                created_at: '2025-01-15T00:00:00Z',
                updated_at: '2025-01-15T00:00:00Z'
            },
            {
                id: 'b2c3d4e5-f6a7-4890-b234-567890abcdef',
                event_id: '9',
                name: 'VIP Package',
                description: 'Premium access with reserved seating and complimentary drinks',
                price: 3500, // $35.00 in cents
                capacity: 50,
                sold_count: 25,
                sort_order: 2,
                sale_start: null,
                sale_end: null,
                created_at: '2025-01-15T00:00:00Z',
                updated_at: '2025-01-15T00:00:00Z'
            }
        ],

        // Legacy UUID-based events for backward compatibility
        'b58bd20c-69dd-5483-b678-1f13c3d4e590': [
            {
                id: 'ticket-2-1',
                event_id: 'b58bd20c-69dd-5483-b678-1f13c3d4e590',
                name: 'Standard Admission',
                description: 'Includes networking session, refreshments, and welcome packet',
                price: 2500, // $25.00 in cents
                capacity: 80,
                sold_count: 45,
                sort_order: 0,
                sale_start: '2024-01-15T00:00:00.000Z',
                sale_end: '2024-02-22T16:00:00.000Z',
                created_at: '2024-01-10T00:00:00.000Z',
                updated_at: '2024-01-10T00:00:00.000Z'
            },
            {
                id: 'ticket-2-2',
                event_id: 'b58bd20c-69dd-5483-b678-1f13c3d4e590',
                name: 'VIP Package',
                description: 'Priority networking, private speaker meet & greet, premium refreshments',
                price: 5000, // $50.00 in cents
                capacity: 20,
                sold_count: 8,
                sort_order: 1,
                sale_start: '2024-01-15T00:00:00.000Z',
                sale_end: '2024-02-22T16:00:00.000Z',
                created_at: '2024-01-10T00:00:00.000Z',
                updated_at: '2024-01-10T00:00:00.000Z'
            }
        ],

        'c69de41e-8bff-4605-a89a-3f35e5f6d702': [
            {
                id: 'ticket-3-1',
                event_id: 'c69de41e-8bff-4605-a89a-3f35e5f6d702',
                name: 'Child Participant',
                description: 'Workshop participation for one child (ages 6-12), includes all materials',
                price: 1500, // $15.00 in cents
                capacity: 18,
                sold_count: 8,
                sort_order: 0,
                sale_start: '2024-04-15T00:00:00.000Z',
                sale_end: '2024-05-20T13:00:00.000Z',
                created_at: '2024-04-01T00:00:00.000Z',
                updated_at: '2024-04-01T00:00:00.000Z'
            },
            {
                id: 'ticket-3-2',
                event_id: 'c69de41e-8bff-4605-a89a-3f35e5f6d702',
                name: 'Family Package',
                description: 'Workshop for up to 2 children plus 1 adult companion',
                price: 2500, // $25.00 in cents
                capacity: 5,
                sold_count: 2,
                sort_order: 1,
                sale_start: '2024-04-15T00:00:00.000Z',
                sale_end: '2024-05-20T13:00:00.000Z',
                created_at: '2024-04-01T00:00:00.000Z',
                updated_at: '2024-04-01T00:00:00.000Z'
            }
        ],

        'a0ddf64f-cf33-8a49-eccf-7379c9aab046': [
            {
                id: 'ticket-7-1',
                event_id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046',
                name: 'General Admission',
                description: 'Access to presentations and networking session',
                price: 2000, // $20.00 in cents
                capacity: 100,
                sold_count: 67,
                sort_order: 0,
                sale_start: '2024-03-01T00:00:00.000Z',
                sale_end: '2024-04-10T16:00:00.000Z',
                created_at: '2024-02-15T00:00:00.000Z',
                updated_at: '2024-02-15T00:00:00.000Z'
            },
            {
                id: 'ticket-7-2',
                event_id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046',
                name: 'Investor Pass',
                description: 'VIP seating, exclusive investor networking, and pitch deck access',
                price: 7500, // $75.00 in cents
                capacity: 20,
                sold_count: 12,
                sort_order: 1,
                sale_start: '2024-03-01T00:00:00.000Z',
                sale_end: '2024-04-10T16:00:00.000Z',
                created_at: '2024-02-15T00:00:00.000Z',
                updated_at: '2024-02-15T00:00:00.000Z'
            }
        ],

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
                updated_at: '2024-01-15T00:00:00Z'
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
                updated_at: '2024-01-15T00:00:00Z'
            }
        ],

        'f522fb94-1488-df9e-31fd-c8ce4a4f559b': [
            {
                id: 'ticket-12-1',
                event_id: 'f522fb94-1488-df9e-31fd-c8ce4a4f559b',
                name: '5K Registration',
                description: 'Includes race bib, timing chip, t-shirt, and post-race refreshments',
                price: 3000, // $30.00 in cents
                capacity: 250,
                sold_count: 178,
                sort_order: 0,
                sale_start: '2024-02-01T00:00:00.000Z',
                sale_end: '2024-04-07T06:00:00.000Z',
                created_at: '2024-01-15T00:00:00.000Z',
                updated_at: '2024-01-15T00:00:00.000Z'
            },
            {
                id: 'ticket-12-2',
                event_id: 'f522fb94-1488-df9e-31fd-c8ce4a4f559b',
                name: '1-Mile Family Walk',
                description: 'Family-friendly walk includes t-shirt and refreshments',
                price: 1500, // $15.00 in cents
                capacity: 50,
                sold_count: 32,
                sort_order: 1,
                sale_start: '2024-02-01T00:00:00.000Z',
                sale_end: '2024-04-07T06:00:00.000Z',
                created_at: '2024-01-15T00:00:00.000Z',
                updated_at: '2024-01-15T00:00:00.000Z'
            }
        ]
    };

    return sampleTickets[eventId] || null;
}

// GET /api/ticket-types - List ticket types for an event
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('event_id');

        if (!eventId) {
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            );
        }

        // For development/demo: Check for sample event tickets first (supports both numeric and UUID formats)
        const sampleEventTickets = getSampleTicketTypes(eventId);
        if (sampleEventTickets) {
            return NextResponse.json({ ticket_types: sampleEventTickets });
        }

        // For real database events: Validate UUID format and query database
        const eventIdSchema = z.string().uuid();
        const validationResult = eventIdSchema.safeParse(eventId);

        if (!validationResult.success) {
            // If it's not a UUID and not a sample event, it's invalid
            return NextResponse.json(
                { error: 'Invalid event ID format or event not found' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Get ticket types for the specified event from database
        const { data: ticketTypes, error } = await supabase
            .from('ticket_types')
            .select('*')
            .eq('event_id', eventId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching ticket types:', error);
            return NextResponse.json(
                { error: 'Failed to fetch ticket types' },
                { status: 500 }
            );
        }

        return NextResponse.json({ ticket_types: ticketTypes || [] });

    } catch (error) {
        console.error('Unexpected error in GET /api/ticket-types:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/ticket-types - Create a new ticket type
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = ticketTypeSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const ticketTypeData = validationResult.data;
        const supabase = await createServerSupabaseClient();

        // Check if user is authenticated and is the event organizer
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify user is the event organizer
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('organizer_id, title')
            .eq('id', ticketTypeData.event_id)
            .single();

        if (eventError || !event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        if (event.organizer_id !== user.id) {
            return NextResponse.json(
                { error: 'Only event organizers can create ticket types' },
                { status: 403 }
            );
        }

        // Create the ticket type
        const { data: newTicketType, error: createError } = await supabase
            .from('ticket_types')
            .insert({
                event_id: ticketTypeData.event_id,
                name: ticketTypeData.name,
                description: ticketTypeData.description,
                price: ticketTypeData.price,
                capacity: ticketTypeData.capacity,
                sort_order: ticketTypeData.sort_order,
                sale_start: ticketTypeData.sale_start,
                sale_end: ticketTypeData.sale_end,
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating ticket type:', createError);
            return NextResponse.json(
                { error: 'Failed to create ticket type' },
                { status: 500 }
            );
        }

        // Update event to mark as paid if it wasn't already
        const { error: updateError } = await supabase
            .from('events')
            .update({ is_paid: true })
            .eq('id', ticketTypeData.event_id);

        if (updateError) {
            console.warn('Failed to update event paid status:', updateError);
            // Non-critical error, don't fail the request
        }

        return NextResponse.json(
            {
                message: 'Ticket type created successfully',
                ticket_type: newTicketType
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Unexpected error in POST /api/ticket-types:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 