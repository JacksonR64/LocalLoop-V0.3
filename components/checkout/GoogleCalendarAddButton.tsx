'use client'

import { GoogleCalendarConnectWithStatus } from '@/components/GoogleCalendarConnect'

interface GoogleCalendarAddButtonProps {
    eventTitle: string
    eventTime: string
    eventLocation: string
    // paymentIntentId: string  // Currently unused but may be needed for future features
    // customerEmail: string    // Currently unused but may be needed for future features
    className?: string
}

export default function GoogleCalendarAddButton({
    eventTitle,
    eventTime,
    eventLocation,
    className = ''
}: GoogleCalendarAddButtonProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="text-sm text-gray-600 text-center mb-4">
                Add this event to your Google Calendar for easy access
            </div>
            <GoogleCalendarConnectWithStatus
                action="create_event"
                returnUrl={`/events/${eventTitle}`}
                eventData={{
                    id: eventTitle,
                    title: eventTitle,
                    description: eventLocation,
                    start_time: eventTime,
                    end_time: eventTime,
                    location: eventLocation,
                    is_paid: true,
                    rsvp_count: 0,
                    organizer: { display_name: 'Event Organizer' }
                }}
            />
        </div>
    )
} 