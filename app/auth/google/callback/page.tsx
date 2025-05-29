'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

/**
 * Loading fallback component for OAuth callback processing
 */
function CallbackLoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="space-y-6">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Processing...
                        </h1>
                        <p className="text-gray-600">
                            Please wait while we complete your Google Calendar connection.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * OAuth Callback Content Component
 * Handles OAuth flow completion and user feedback
 * Extracted to separate component to use with Suspense boundary
 */
function GoogleCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [redirecting, setRedirecting] = useState(false)

    // Extract URL parameters
    const isSuccess = searchParams.get('success') === 'true'
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    const action = searchParams.get('action') || 'connect'
    const returnUrl = searchParams.get('returnUrl') || '/dashboard'

    // Auto-redirect after success
    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                setRedirecting(true)
                router.push(returnUrl)
            }, 2000) // 2 second delay to show success message

            return () => clearTimeout(timer)
        }
    }, [isSuccess, returnUrl, router])

    // Get action-specific messages
    const getActionMessage = (action: string) => {
        switch (action) {
            case 'create_event':
                return 'ready to add events to your calendar'
            case 'sync':
                return 'calendar sync is now active'
            case 'connect':
            default:
                return 'connected to your Google Calendar'
        }
    }

    const getErrorTitle = (errorCode: string | null) => {
        switch (errorCode) {
            case 'access_denied':
                return 'Access Denied'
            case 'invalid_request':
                return 'Invalid Request'
            case 'invalid_state':
                return 'Security Error'
            case 'token_exchange_failed':
                return 'Connection Failed'
            case 'storage_failed':
                return 'Save Failed'
            case 'user_mismatch':
                return 'Authentication Error'
            default:
                return 'Connection Error'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                {isSuccess ? (
                    // Success State
                    <div className="space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Success!
                            </h1>
                            <p className="text-gray-600">
                                Your Google Calendar is now {getActionMessage(action)}.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {redirecting ? (
                                <div className="flex items-center justify-center space-x-2 text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Redirecting...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Redirecting you back in a moment...
                                </p>
                            )}

                            <button
                                onClick={() => router.push(returnUrl)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    // Error State
                    <div className="space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {getErrorTitle(error)}
                            </h1>
                            <p className="text-gray-600">
                                {message || 'Unable to connect your Google Calendar at this time.'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {error === 'access_denied' ? (
                                <p className="text-sm text-gray-500">
                                    You can try connecting again anytime from your dashboard.
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Please try again or contact support if the problem persists.
                                </p>
                            )}

                            <div className="space-y-2">
                                <button
                                    onClick={() => router.push('/api/auth/google/connect')}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Try Again
                                </button>

                                <button
                                    onClick={() => router.push(returnUrl)}
                                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Google OAuth Callback Page
 * Uses Suspense boundary to properly handle useSearchParams
 * 
 * URL Parameters:
 * - success: 'true' if OAuth completed successfully
 * - error: Error code if OAuth failed
 * - message: Human-readable error message
 * - action: OAuth action context ('connect', 'create_event', 'sync')
 * - returnUrl: URL to redirect to after OAuth completion
 */
export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={<CallbackLoadingFallback />}>
            <GoogleCallbackContent />
        </Suspense>
    )
} 