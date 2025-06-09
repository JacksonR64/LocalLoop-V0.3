import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'
import { createServerSupabaseClient } from './supabase-server'

export interface AuthUser {
    id: string
    email: string | undefined
    user_metadata?: Record<string, unknown>
    role: UserRole
}

export interface AuthSession {
    user: AuthUser
    access_token: string
    refresh_token: string
}

export type UserRole = 'user' | 'organizer' | 'admin'

export interface AuthResult {
    success: boolean
    user?: AuthUser
    error?: string
    statusCode?: number
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// Sign in with Google OAuth
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        },
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// Sign in with Apple OAuth
export async function signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        },
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// Sign out
export async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
        throw new Error(error.message)
    }
}

// Get current session
export async function getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
        throw new Error(error.message)
    }

    return session
}

// Get current user
export async function getUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
        throw new Error(error.message)
    }

    return user
}

// Reset password
export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/reset-password`,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// Update password
export async function updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
        password,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

/**
 * Authenticate user and verify they have staff access (organizer or admin)
 */
export async function authenticateStaff(): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return {
                success: false,
                error: 'Unauthorized',
                statusCode: 401
            }
        }

        // Get user role
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError) {
            return {
                success: false,
                error: 'Failed to verify user permissions',
                statusCode: 500
            }
        }

        if (!['organizer', 'admin'].includes(userData?.role)) {
            return {
                success: false,
                error: 'Staff access required',
                statusCode: 403
            }
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email || '',
                role: userData.role as UserRole
            }
        }

    } catch (error) {
        console.error('Authentication error:', error)
        return {
            success: false,
            error: 'Authentication failed',
            statusCode: 500
        }
    }
}

/**
 * Check if user has permission to access a specific event
 */
export async function canAccessEvent(userId: string, userRole: UserRole, eventId: string): Promise<boolean> {
    // Admins can access all events
    if (userRole === 'admin') {
        return true
    }

    // Organizers can only access their own events
    if (userRole === 'organizer') {
        try {
            const supabase = await createServerSupabaseClient()
            const { data: event, error } = await supabase
                .from('events')
                .select('organizer_id')
                .eq('id', eventId)
                .single()

            if (error || !event) {
                return false
            }

            return event.organizer_id === userId
        } catch (error) {
            console.error('Event access check error:', error)
            return false
        }
    }

    return false
}

/**
 * Apply role-based filtering to a Supabase query for events
 */
export function applyEventRoleFilter(query: { eq: (field: string, value: string) => unknown }, userRole: UserRole, userId: string) {
    if (userRole === 'organizer') {
        return query.eq('organizer_id', userId)
    }
    // Admins see all events, no additional filtering
    return query
}

/**
 * Apply role-based filtering to events data in code
 */
export function filterEventsByRole(events: Array<{ organizer_id: string }>, userRole: UserRole, userId: string): Array<{ organizer_id: string }> {
    if (userRole === 'admin') {
        return events
    }

    if (userRole === 'organizer') {
        return events.filter(event => event.organizer_id === userId)
    }

    return []
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(userRole: UserRole): boolean {
    return userRole === 'admin'
}

/**
 * Check if user has organizer privileges (includes admin)
 */
export function isOrganizer(userRole: UserRole): boolean {
    return ['organizer', 'admin'].includes(userRole)
}

/**
 * Get allowed roles for staff access
 */
export function getStaffRoles(): UserRole[] {
    return ['organizer', 'admin']
} 