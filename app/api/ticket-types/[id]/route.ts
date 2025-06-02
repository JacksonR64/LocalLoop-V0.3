import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Ticket type update schema (partial of the create schema)
const ticketTypeUpdateSchema = z.object({
    name: z.string().min(1, 'Ticket type name is required').max(100, 'Name must be 100 characters or less').optional(),
    description: z.string().optional(),
    price: z.number().int().min(0, 'Price must be non-negative').optional(), // in cents
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
    sort_order: z.number().int().min(0).optional(),
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

// GET /api/ticket-types/[id] - Get a specific ticket type
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: ticketTypeId } = await params;

        // Validate ticket type ID format
        const idSchema = z.string().uuid();
        const validationResult = idSchema.safeParse(ticketTypeId);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid ticket type ID format' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Get the ticket type with event information
        const { data: ticketType, error } = await supabase
            .from('ticket_types')
            .select(`
                *,
                events (
                    id,
                    title,
                    organizer_id
                )
            `)
            .eq('id', ticketTypeId)
            .single();

        if (error || !ticketType) {
            return NextResponse.json(
                { error: 'Ticket type not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ticket_type: ticketType });

    } catch (error) {
        console.error('Unexpected error in GET /api/ticket-types/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/ticket-types/[id] - Update a specific ticket type
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: ticketTypeId } = await params;
        const body = await request.json();

        // Validate ticket type ID format
        const idSchema = z.string().uuid();
        const idValidation = idSchema.safeParse(ticketTypeId);

        if (!idValidation.success) {
            return NextResponse.json(
                { error: 'Invalid ticket type ID format' },
                { status: 400 }
            );
        }

        // Validate request body
        const validationResult = ticketTypeUpdateSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const updateData = validationResult.data;
        const supabase = await createServerSupabaseClient();

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get the ticket type with event information to verify ownership
        const { data: ticketType, error: fetchError } = await supabase
            .from('ticket_types')
            .select(`
                *,
                events (
                    organizer_id,
                    title
                )
            `)
            .eq('id', ticketTypeId)
            .single();

        if (fetchError || !ticketType) {
            return NextResponse.json(
                { error: 'Ticket type not found' },
                { status: 404 }
            );
        }

        // Verify user is the event organizer
        if (ticketType.events?.organizer_id !== user.id) {
            return NextResponse.json(
                { error: 'Only event organizers can update ticket types' },
                { status: 403 }
            );
        }

        // Check if there are existing tickets sold (prevent certain updates)
        const { data: soldTickets, error: ticketError } = await supabase
            .from('tickets')
            .select('id')
            .eq('ticket_type_id', ticketTypeId)
            .limit(1);

        if (ticketError) {
            console.error('Error checking sold tickets:', ticketError);
        }

        const hasSoldTickets = soldTickets && soldTickets.length > 0;

        // Restrict certain updates if tickets have been sold
        if (hasSoldTickets) {
            const restrictedFields = ['price'];
            const attemptedRestrictedUpdates = restrictedFields.filter(field =>
                updateData.hasOwnProperty(field)
            );

            if (attemptedRestrictedUpdates.length > 0) {
                return NextResponse.json(
                    {
                        error: 'Cannot update price after tickets have been sold',
                        restricted_fields: attemptedRestrictedUpdates
                    },
                    { status: 400 }
                );
            }
        }

        // Update the ticket type
        const { data: updatedTicketType, error: updateError } = await supabase
            .from('ticket_types')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', ticketTypeId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating ticket type:', updateError);
            return NextResponse.json(
                { error: 'Failed to update ticket type' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Ticket type updated successfully',
            ticket_type: updatedTicketType
        });

    } catch (error) {
        console.error('Unexpected error in PATCH /api/ticket-types/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/ticket-types/[id] - Delete a specific ticket type
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: ticketTypeId } = await params;

        // Validate ticket type ID format
        const idSchema = z.string().uuid();
        const validationResult = idSchema.safeParse(ticketTypeId);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid ticket type ID format' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get the ticket type with event information to verify ownership
        const { data: ticketType, error: fetchError } = await supabase
            .from('ticket_types')
            .select(`
                *,
                events (
                    organizer_id,
                    title
                )
            `)
            .eq('id', ticketTypeId)
            .single();

        if (fetchError || !ticketType) {
            return NextResponse.json(
                { error: 'Ticket type not found' },
                { status: 404 }
            );
        }

        // Verify user is the event organizer
        if (ticketType.events?.organizer_id !== user.id) {
            return NextResponse.json(
                { error: 'Only event organizers can delete ticket types' },
                { status: 403 }
            );
        }

        // Check if there are existing tickets sold (prevent deletion)
        const { data: soldTickets, error: ticketError } = await supabase
            .from('tickets')
            .select('id')
            .eq('ticket_type_id', ticketTypeId)
            .limit(1);

        if (ticketError) {
            console.error('Error checking sold tickets:', ticketError);
            return NextResponse.json(
                { error: 'Failed to verify ticket sales status' },
                { status: 500 }
            );
        }

        if (soldTickets && soldTickets.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete ticket type with existing sold tickets' },
                { status: 400 }
            );
        }

        // Delete the ticket type
        const { error: deleteError } = await supabase
            .from('ticket_types')
            .delete()
            .eq('id', ticketTypeId);

        if (deleteError) {
            console.error('Error deleting ticket type:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete ticket type' },
                { status: 500 }
            );
        }

        // Check if this was the last ticket type for the event
        const { data: remainingTicketTypes, error: countError } = await supabase
            .from('ticket_types')
            .select('id')
            .eq('event_id', ticketType.event_id);

        if (!countError && (!remainingTicketTypes || remainingTicketTypes.length === 0)) {
            // Update event to mark as free if no ticket types remain
            await supabase
                .from('events')
                .update({ is_paid: false })
                .eq('id', ticketType.event_id);
        }

        return NextResponse.json({
            message: 'Ticket type deleted successfully'
        });

    } catch (error) {
        console.error('Unexpected error in DELETE /api/ticket-types/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 