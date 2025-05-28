import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
    id: string
    email: string | undefined
    user_metadata: Record<string, unknown>
}

export interface AuthSession {
    user: AuthUser
    access_token: string
    refresh_token: string
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
            redirectTo: `${window.location.origin}/auth/callback`,
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
            redirectTo: `${window.location.origin}/auth/callback`,
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
        redirectTo: `${window.location.origin}/auth/reset-password`,
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