import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendWelcomeEmail } from '@/lib/email-service'
import { z } from 'zod'

// Welcome email request schema
const welcomeEmailSchema = z.object({
    user_id: z.string().uuid('Invalid user ID format'),
    user_email: z.string().email('Invalid email format').optional(),
    user_name: z.string().min(1, 'User name is required').optional(),
})

/**
 * POST /api/auth/welcome
 * Send welcome email to a new user
 * 
 * This endpoint can be called:
 * 1. From the frontend after successful signup
 * 2. From a Supabase webhook (future enhancement)
 * 3. Manually for existing users who didn't receive welcome email
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = await createServerSupabaseClient()

        // Validate request body
        const result = welcomeEmailSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: result.error.format() },
                { status: 400 }
            )
        }

        const { user_id, user_email, user_name } = result.data

        // Get user details from Supabase if not provided
        let userName = user_name
        let userEmail = user_email

        if (!userName || !userEmail) {
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id)

            if (authError || !authUser.user) {
                console.error('Error fetching user details:', authError)
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                )
            }

            userEmail = userEmail || authUser.user.email
            userName = userName || authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'User'
        }

        if (!userEmail) {
            return NextResponse.json(
                { error: 'User email not found' },
                { status: 400 }
            )
        }

        // 🔧 TEMPORARY: Skip database check for welcome_email_sent column
        // TODO: Add back once database schema is updated
        console.log('⚠️ Skipping welcome email duplicate check (database column not ready)')

        // Send welcome email
        try {
            const emailResult = await sendWelcomeEmail({
                to: userEmail,
                userName: userName!,
            })

            if (!emailResult.success) {
                console.error('Failed to send welcome email:', emailResult.error)
                return NextResponse.json(
                    { error: 'Failed to send welcome email', details: emailResult.error },
                    { status: 500 }
                )
            }

            // 🔧 TEMPORARY: Skip database update for welcome_email_sent 
            // TODO: Add back once database schema is updated
            console.log('⚠️ Skipping welcome email status update (database column not ready)')

            console.log(`Welcome email sent successfully to ${userEmail} (${user_id}):`, emailResult.messageId)

            return NextResponse.json({
                message: 'Welcome email sent successfully',
                messageId: emailResult.messageId,
                success: true
            })

        } catch (emailError) {
            console.error('Error sending welcome email:', emailError)
            return NextResponse.json(
                { error: 'Failed to send welcome email' },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('Unexpected error in POST /api/auth/welcome:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/auth/welcome
 * Check welcome email status for current user
 */
export async function GET() {
    try {
        // 🔧 TEMPORARY: Return default status since database column not ready
        return NextResponse.json({
            welcome_email_sent: false,
            welcome_email_sent_at: null,
            note: 'Database schema pending update'
        })

    } catch (error) {
        console.error('Unexpected error in GET /api/auth/welcome:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 