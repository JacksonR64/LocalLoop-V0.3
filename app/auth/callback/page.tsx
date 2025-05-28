'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering to prevent pre-rendering issues
export const dynamic = 'force-dynamic'

export default function AuthCallback() {
    const router = useRouter()

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Auth callback error:', error)
                    router.push('/auth/login?error=callback_error')
                    return
                }

                if (data.session) {
                    // Successful authentication, redirect to dashboard or home
                    router.push('/')
                } else {
                    // No session, redirect to login
                    router.push('/auth/login')
                }
            } catch (error) {
                console.error('Unexpected error in auth callback:', error)
                router.push('/auth/login?error=unexpected_error')
            }
        }

        handleAuthCallback()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing authentication...</p>
            </div>
        </div>
    )
} 