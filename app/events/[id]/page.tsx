import React, { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { EventData } from '@/components/events';
import { notFound } from 'next/navigation'
import { EventDetailClient } from '@/components/events/EventDetailClient'

// Helper function to map numeric ID to UUID
function mapEventIdToUuid(numericId: string): string {
    const idMap: Record<string, string> = {
        '1': '550e8400-e29b-41d4-a716-446655440001',
        '2': '550e8400-e29b-41d4-a716-446655440002',
        '3': '550e8400-e29b-41d4-a716-446655440003',
        '4': '550e8400-e29b-41d4-a716-446655440004',
        '5': '550e8400-e29b-41d4-a716-446655440005',
        '6': '550e8400-e29b-41d4-a716-446655440006',
        '7': '550e8400-e29b-41d4-a716-446655440007',
        '8': '550e8400-e29b-41d4-a716-446655440008',
        '9': '550e8400-e29b-41d4-a716-446655440009',
        '10': '550e8400-e29b-41d4-a716-446655440010',
        '11': '550e8400-e29b-41d4-a716-446655440011'
    };
    return idMap[numericId] || numericId;
}

// Server function to fetch event data from database
async function getEventData(eventId: string): Promise<EventData | null> {
    const supabase = await createServerSupabaseClient();
    const uuid = mapEventIdToUuid(eventId);

    const { data: event, error } = await supabase
        .from('events')
        .select(`
      id,
      title,
      description,
      short_description,
      start_time,
      end_time,
      location,
      category,
      is_paid,
      featured,
      capacity,
      image_url,
      organizer_id,
      users!events_organizer_id_fkey(display_name),
      rsvps(user_id)
    `)
        .eq('id', uuid)
        .eq('published', true)
        .single();

    if (error || !event) {
        console.error('Error fetching event:', error);
        return null;
    }

    // Transform data to match EventData interface
    interface UserData {
        display_name: string
    }

    return {
        id: eventId, // Keep the numeric ID for routing
        title: event.title,
        description: event.description,
        short_description: event.short_description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        category: event.category,
        is_paid: event.is_paid,
        featured: event.featured,
        capacity: event.capacity,
        rsvp_count: event.rsvps?.length || 0,
        image_url: event.image_url,
        organizer: {
            display_name: (Array.isArray(event.users)
                ? (event.users[0] as UserData)?.display_name
                : (event.users as UserData)?.display_name) || 'Unknown Organizer'
        }
    };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch event data from database
    const eventData = await getEventData(id);

    if (!eventData) {
        notFound();
    }

    return (
        <Suspense fallback={<div>Loading event...</div>}>
            <EventDetailClient event={eventData} />
        </Suspense>
    );
} 