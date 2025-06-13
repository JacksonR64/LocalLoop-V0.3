'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const {
        signUp,
        signInWithGoogle,
        signInWithApple,
        isGoogleAuthEnabled,
        isAppleAuthEnabled
    } = useAuth()
    const router = useRouter()

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await signUp(email, password)
            router.push('/')
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
        } finally {
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
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                        Create your LocalLoop account
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Or{' '}
                        <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleEmailSignup}>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
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
                                className="relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-background rounded-t-md focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-background rounded-b-md focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {/* Google Auth Button */}
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                disabled={!isGoogleAuthEnabled}
                                className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${isGoogleAuthEnabled
                                    ? 'border-border bg-background text-muted-foreground hover:bg-accent'
                                    : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
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
                                    ? 'border-border bg-background text-muted-foreground hover:bg-accent'
                                    : 'border-border bg-muted text-muted-foreground cursor-not-allowed relative'
                                    }`}
                                title={!isAppleAuthEnabled ? 'Coming soon! Requires Apple Developer account' : ''}
                            >
                                {!isAppleAuthEnabled && (
                                    <Lock className="w-3 h-3 mr-1 text-muted-foreground" />
                                )}
                                <span>Apple</span>
                                {!isAppleAuthEnabled && (
                                    <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
                                )}
                            </button>
                        </div>

                        {!isAppleAuthEnabled && (
                            <p className="mt-2 text-xs text-center text-muted-foreground">
                                Apple Sign-in coming soon! We&apos;re working on getting an Apple Developer account.
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
} 