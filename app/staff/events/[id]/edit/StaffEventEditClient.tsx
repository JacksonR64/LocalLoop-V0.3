'use client'

import { useRouter } from 'next/navigation'
import EventForm from '@/components/events/EventForm'

interface StaffEventEditClientProps {
    eventId: string
}

export default function StaffEventEditClient({ eventId }: StaffEventEditClientProps) {
    const router = useRouter()

    const handleSuccess = () => {
        // Redirect to the staff dashboard after successful edit
        router.push('/staff?tab=events')
    }

    const handleCancel = () => {
        router.push('/staff')
    }

    return (
        <EventForm
            eventId={eventId}
            isEdit={true}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    )
} 