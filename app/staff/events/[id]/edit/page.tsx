import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/ui/Navigation'
import StaffEventEditClient from './StaffEventEditClient'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createServerSupabaseClient()
    const { id: eventId } = await params

    // Get the current user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Get user details including role
    const { data: userDetails } = await supabase
        .from('users')
        .select('id, email, display_name, role')
        .eq('id', user.id)
        .single()

    // Check if user has organizer or admin role
    if (!userDetails || !['organizer', 'admin'].includes(userDetails.role)) {
        redirect('/auth/login?error=insufficient_permissions')
    }

    // Get the event to edit
    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

    if (error || !event) {
        redirect('/staff?error=event_not_found')
    }

    // Check if user can edit this event (admins can edit any event, organizers can only edit their own)
    if (userDetails.role === 'organizer' && event.organizer_id !== user.id) {
        redirect('/staff?error=insufficient_permissions')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            {/* Main Content */}
            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
                        <p className="mt-2 text-gray-600">Editing: {event.title}</p>
                    </div>
                    <StaffEventEditClient eventId={eventId} />
                </div>
            </main>
        </div>
    )
} 