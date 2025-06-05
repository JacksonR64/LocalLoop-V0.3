import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { role } = await request.json()

        // Validate role
        if (!['user', 'organizer', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Update user role
        const { error: updateError } = await supabase
            .from('users')
            .update({ role })
            .eq('id', user.id)

        if (updateError) {
            console.error('Role update error:', updateError)
            return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
        }

        return NextResponse.json({
            message: `Role updated to ${role}`,
            user_id: user.id,
            new_role: role
        })

    } catch (error) {
        console.error('Role upgrade error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 