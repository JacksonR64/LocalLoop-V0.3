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

        // Validate event ID format
        const eventIdSchema = z.string().uuid();
        const validationResult = eventIdSchema.safeParse(eventId);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid event ID format' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Get ticket types for the specified event
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