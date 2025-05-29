'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
// import { useRouter } from 'next/navigation' // Will be used when disconnect functionality is implemented

/**
 * Google Calendar Connection Component
 * Provides UI for connecting/disconnecting Google Calendar
 * Shows connection status and handles OAuth flow initiation
 */

export interface GoogleCalendarConnectProps {
    /** Current user's Google Calendar connection status */
    isConnected?: boolean
    /** Action context for OAuth flow */
    action?: 'connect' | 'create_event' | 'sync'
    /** URL to return to after OAuth completion */
    returnUrl?: string
    /** Additional CSS classes */
    className?: string
    /** Callback when connection status changes */
    onStatusChange?: (connected: boolean) => void
}

export default function GoogleCalendarConnect({
    isConnected = false,
    action = 'connect',
    returnUrl,
    className = '',
    onStatusChange // eslint-disable-line @typescript-eslint/no-unused-vars
}: GoogleCalendarConnectProps) {
    // const router = useRouter() // Will be used in disconnect functionality later
    const [isLoading, setIsLoading] = useState(false)
    const [localConnected, setLocalConnected] = useState(isConnected)

    // Update local state when prop changes
    useEffect(() => {
        setLocalConnected(isConnected)
    }, [isConnected])

    const handleConnect = async () => {
        try {
            setIsLoading(true)

            // Build OAuth initiation URL with parameters
            const params = new URLSearchParams({
                action,
                ...(returnUrl && { returnUrl })
            })

            // Redirect to OAuth initiation endpoint
            const connectUrl = `/api/auth/google/connect?${params.toString()}`
            window.location.href = connectUrl

        } catch (error) {
            console.error('Error initiating Google Calendar connection:', error)
            setIsLoading(false)
        }
    }

    const handleDisconnect = async () => {
        try {
            setIsLoading(true)

            // TODO: Implement disconnect API endpoint
            // const response = await fetch('/api/auth/google/disconnect', { method: 'POST' })
            // if (response.ok) {
            //   setLocalConnected(false)
            //   onStatusChange?.(false)
            // }

            console.log('Disconnect functionality will be implemented in Task 4.6')
            // onStatusChange will be used when disconnect is implemented

        } catch (error) {
            console.error('Error disconnecting Google Calendar:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getActionText = () => {
        switch (action) {
            case 'create_event':
                return 'Enable Calendar Events'
            case 'sync':
                return 'Enable Calendar Sync'
            case 'connect':
            default:
                return 'Connect Google Calendar'
        }
    }

    const getStatusText = () => {
        if (localConnected) {
            switch (action) {
                case 'create_event':
                    return 'Calendar events enabled'
                case 'sync':
                    return 'Calendar sync active'
                case 'connect':
                default:
                    return 'Google Calendar connected'
            }
        }
        return 'Not connected'
    }

    return (
        <div className={`p-4 border rounded-lg ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Google Calendar</span>
                    </div>

                    <div className="flex items-center space-x-1">
                        {localConnected ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">{getStatusText()}</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <span className="text-sm text-gray-500">{getStatusText()}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {localConnected ? (
                        <button
                            onClick={handleDisconnect}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Disconnecting...</span>
                                </div>
                            ) : (
                                'Disconnect'
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Connecting...</span>
                                </div>
                            ) : (
                                getActionText()
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Additional context based on action */}
            {action === 'create_event' && (
                <p className="mt-2 text-xs text-gray-500">
                    Allows LocalLoop to add events directly to your Google Calendar
                </p>
            )}

            {action === 'sync' && (
                <p className="mt-2 text-xs text-gray-500">
                    Synchronizes your LocalLoop events with your Google Calendar
                </p>
            )}

            {action === 'connect' && (
                <p className="mt-2 text-xs text-gray-500">
                    Connect your Google Calendar to enable event management and one-click calendar additions
                </p>
            )}
        </div>
    )
} 