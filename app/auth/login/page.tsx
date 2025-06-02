'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const {
        user,
        loading: authLoading,
        signIn,
        signInWithGoogle,
        signInWithApple,
        isGoogleAuthEnabled,
        isAppleAuthEnabled
    } = useAuth()
    const router = useRouter()

    // Auto-redirect when user becomes authenticated
    useEffect(() => {
        if (user && !authLoading) {
            router.push('/')
        }
    }, [user, authLoading, router])

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await signIn(email, password)
            // Reset loading state after successful sign in
            setLoading(false)
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        if (!isGoogleAuthEnabled) {
            setError('Google authentication is currently disabled')
            return
        }

        try {
            await signInWithGoogle()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
        }
    }

    const handleAppleLogin = async () => {
        if (!isAppleAuthEnabled) {
            setError('Apple authentication is coming soon! We need an Apple Developer account to enable this feature.')
            return
        }

        try {
            await signInWithApple()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to LocalLoop
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                            create a new account
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-500">
                            Forgot your password?
                        </Link>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {/* Google Auth Button */}
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                disabled={!isGoogleAuthEnabled}
                                className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${isGoogleAuthEnabled
                                    ? 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <span>Google</span>
                            </button>

                            {/* Apple Auth Button */}
                            <button
                                onClick={handleAppleLogin}
                                type="button"
                                disabled={!isAppleAuthEnabled}
                                className={`w-full inline-flex justify-center items-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${isAppleAuthEnabled
                                    ? 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed relative'
                                    }`}
                                title={!isAppleAuthEnabled ? 'Coming soon! Requires Apple Developer account' : ''}
                            >
                                {!isAppleAuthEnabled && (
                                    <Lock className="w-3 h-3 mr-1 text-gray-400" />
                                )}
                                <span>Apple</span>
                                {!isAppleAuthEnabled && (
                                    <span className="ml-1 text-xs text-gray-400">(Soon)</span>
                                )}
                            </button>
                        </div>

                        {!isAppleAuthEnabled && (
                            <p className="mt-2 text-xs text-center text-gray-500">
                                Apple Sign-in coming soon! We&apos;re working on getting an Apple Developer account.
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
} 