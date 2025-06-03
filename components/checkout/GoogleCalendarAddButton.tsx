'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GoogleCalendarAddButtonProps {
    paymentIntentId: string
    eventDetails: {
        id: string
        title: string
        description?: string
        start_time: string
        end_time: string
        location?: string
        timezone: string
    }
    customerEmail: string
    className?: string
}

interface CalendarApiResponse {
    success: boolean
    message?: string
    calendar_event_id?: string
    oauth_required?: boolean
    oauth_url?: string
    error?: string
    fallback_action?: string
}

export default function GoogleCalendarAddButton({
    paymentIntentId,
    eventDetails,
    customerEmail,
    className = ''
}: GoogleCalendarAddButtonProps) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'oauth_required'>('idle')
    const [message, setMessage] = useState<string>('')
    const [oauthUrl, setOauthUrl] = useState<string>('')

    const handleAddToCalendar = async () => {
        try {
            setLoading(true)
            setStatus('idle')
            setMessage('')

            const response = await fetch('/api/calendar/add-to-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_intent_id: paymentIntentId,
                    event_id: eventDetails.id,
                    event_details: eventDetails,
                    customer_email: customerEmail
                })
            })

            const data: CalendarApiResponse = await response.json()

            if (data.success) {
                setStatus('success')
                setMessage(data.message || 'Event successfully added to Google Calendar!')
            } else if (data.oauth_required && data.oauth_url) {
                setStatus('oauth_required')
                setOauthUrl(data.oauth_url)
                setMessage(data.message || 'Google Calendar authorization required')
            } else {
                setStatus('error')
                setMessage(data.error || 'Failed to add event to calendar')
            }

        } catch (error) {
            console.error('Error adding to calendar:', error)
            setStatus('error')
            setMessage('Failed to connect to calendar service')
        } finally {
            setLoading(false)
        }
    }

    const handleOAuthRedirect = () => {
        if (oauthUrl) {
            window.location.href = oauthUrl
        }
    }

    if (status === 'success') {
        return (
            <div className={`space-y-3 ${className}`}>
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        {message}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (status === 'oauth_required') {
        return (
            <div className={`space-y-3 ${className}`}>
                <Alert className="border-blue-200 bg-blue-50">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        {message}
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={handleOAuthRedirect}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                </Button>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className={`space-y-3 ${className}`}>
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        {message}
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={handleAddToCalendar}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Trying again...
                        </>
                    ) : (
                        <>
                            <Calendar className="h-4 w-4 mr-2" />
                            Try Again
                        </>
                    )}
                </Button>
            </div>
        )
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="text-sm text-gray-600 text-center">
                Add this event to your Google Calendar for easy access
            </div>
            <Button
                onClick={handleAddToCalendar}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding to Calendar...
                    </>
                ) : (
                    <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Add to Google Calendar
                    </>
                )}
            </Button>
        </div>
    )
} 