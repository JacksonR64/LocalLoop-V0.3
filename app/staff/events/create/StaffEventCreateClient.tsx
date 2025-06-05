'use client'

import { useRouter } from 'next/navigation'
import EventForm from '@/components/events/EventForm'

export default function StaffEventCreateClient() {
    const router = useRouter()

    const handleSuccess = (eventId: string) => {
        // Redirect to the staff dashboard after successful creation
        router.push('/staff?tab=events')
    }

    const handleCancel = () => {
        router.push('/staff')
    }

    return (
        <EventForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    )
} 