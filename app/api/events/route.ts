import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get the current user
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user details and verify role
        const { data: userDetails } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', user.id)
            .single()

        if (!userDetails || !['organizer', 'admin'].includes(userDetails.role)) {
            return NextResponse.json(
                { error: 'Insufficient permissions. Only organizers and admins can create events.' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // Validate required fields
        const requiredFields = ['title', 'slug', 'description', 'start_time', 'end_time', 'category']
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `${field} is required` },
                    { status: 400 }
                )
            }
        }

        // Validate dates
        const startTime = new Date(body.start_time)
        const endTime = new Date(body.end_time)

        if (startTime >= endTime) {
            return NextResponse.json(
                { error: 'End time must be after start time' },
                { status: 400 }
            )
        }

        if (startTime <= new Date()) {
            return NextResponse.json(
                { error: 'Start time must be in the future' },
                { status: 400 }
            )
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(body.slug)) {
            return NextResponse.json(
                { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
                { status: 400 }
            )
        }

        // Check if slug already exists
        const { data: existingEvent } = await supabase
            .from('events')
            .select('id')
            .eq('slug', body.slug)
            .single()

        if (existingEvent) {
            return NextResponse.json(
                { error: 'An event with this slug already exists' },
                { status: 400 }
            )
        }

        // Validate location requirements
        if (!body.is_online && !body.location) {
            return NextResponse.json(
                { error: 'Location is required for in-person events' },
                { status: 400 }
            )
        }

        if (body.is_online && !body.online_url) {
            return NextResponse.json(
                { error: 'Online URL is required for virtual events' },
                { status: 400 }
            )
        }

        // Validate category
        const validCategories = ['workshop', 'meeting', 'social', 'arts', 'sports', 'family', 'business', 'education', 'other']
        if (!validCategories.includes(body.category)) {
            return NextResponse.json(
                { error: 'Invalid category' },
                { status: 400 }
            )
        }

        // Prepare event data
        const eventData = {
            title: body.title.trim(),
            slug: body.slug.trim(),
            description: body.description.trim(),
            short_description: body.short_description?.trim() || null,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            timezone: body.timezone || 'UTC',
            location: body.location?.trim() || null,
            location_details: body.location_details?.trim() || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
            is_online: body.is_online || false,
            online_url: body.online_url?.trim() || null,
            category: body.category,
            tags: body.tags || [],
            capacity: body.capacity || null,
            is_paid: body.is_paid || false,
            organizer_id: user.id,
            image_url: body.image_url?.trim() || null,
            image_alt_text: body.image_alt_text?.trim() || null,
            featured: body.featured || false,
            published: body.published !== false, // Default to true unless explicitly false
            google_calendar_event_template: body.google_calendar_event_template || {}
        }

        // Create the event
        const { data: event, error } = await supabase
            .from('events')
            .insert([eventData])
            .select()
            .single()

        if (error) {
            console.error('Error creating event:', error)
            return NextResponse.json(
                { error: 'Failed to create event' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            message: 'Event created successfully',
            event
        }, { status: 201 })

    } catch (error) {
        console.error('Error in POST /api/events:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        // Create Supabase client
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)

        // Get query parameters
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const category = searchParams.get('category')
        const organizer_id = searchParams.get('organizer_id')
        const featured = searchParams.get('featured')
        const search = searchParams.get('search')
        const status = searchParams.get('status') || 'upcoming'

        const offset = (page - 1) * limit

        // Build query
        let query = supabase
            .from('events')
            .select(`
        *,
        organizer:users!organizer_id(
          id,
          display_name,
          avatar_url
        )
      `)

        // Apply filters
        if (category) {
            query = query.eq('category', category)
        }

        if (organizer_id) {
            query = query.eq('organizer_id', organizer_id)
        }

        if (featured === 'true') {
            query = query.eq('featured', true)
        }

        if (search) {
            query = query.textSearch('title', search)
        }

        // Status filter
        const now = new Date().toISOString()
        switch (status) {
            case 'upcoming':
                query = query.gt('start_time', now).eq('published', true).eq('cancelled', false)
                break
            case 'past':
                query = query.lt('end_time', now).eq('published', true)
                break
            case 'in_progress':
                query = query.lte('start_time', now).gte('end_time', now).eq('published', true)
                break
            case 'cancelled':
                query = query.eq('cancelled', true)
                break
            case 'draft':
                query = query.eq('published', false)
                break
            case 'all':
                break
            default:
                query = query.gt('start_time', now).eq('published', true).eq('cancelled', false)
        }

        // Apply pagination and ordering
        query = query
            .order('start_time', { ascending: true })
            .range(offset, offset + limit - 1)

        const { data: events, error } = await query

        if (error) {
            console.error('Error fetching events:', error)
            return NextResponse.json(
                { error: 'Failed to fetch events' },
                { status: 500 }
            )
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('events')
            .select('id', { count: 'exact', head: true })

        // Apply same filters for count
        if (category) countQuery = countQuery.eq('category', category)
        if (organizer_id) countQuery = countQuery.eq('organizer_id', organizer_id)
        if (featured === 'true') countQuery = countQuery.eq('featured', true)
        if (search) countQuery = countQuery.textSearch('title', search)

        switch (status) {
            case 'upcoming':
                countQuery = countQuery.gt('start_time', now).eq('published', true).eq('cancelled', false)
                break
            case 'past':
                countQuery = countQuery.lt('end_time', now).eq('published', true)
                break
            case 'in_progress':
                countQuery = countQuery.lte('start_time', now).gte('end_time', now).eq('published', true)
                break
            case 'cancelled':
                countQuery = countQuery.eq('cancelled', true)
                break
            case 'draft':
                countQuery = countQuery.eq('published', false)
                break
        }

        const { count } = await countQuery

        return NextResponse.json({
            events,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        })

    } catch (error) {
        console.error('Error in GET /api/events:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 