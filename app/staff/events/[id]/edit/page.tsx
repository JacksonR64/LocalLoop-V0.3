import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/staff"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Link>
                            <div className="h-6 w-px bg-gray-300" />
                            <h1 className="text-xl font-semibold text-gray-900">Edit Event</h1>
                            <span className="text-sm text-gray-500">({event.title})</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href={`/events/${event.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                View Live Event →
                            </Link>
                            <span className="text-sm text-gray-600">
                                Welcome, {userDetails.display_name || userDetails.email}
                            </span>
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {(userDetails.display_name || userDetails.email || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <StaffEventEditClient eventId={eventId} />
                </div>
            </main>
        </div>
    )
} 