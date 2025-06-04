import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import EventForm from '@/components/events/EventForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CreateEventPage() {
    const supabase = await createServerSupabaseClient()

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
                            <h1 className="text-xl font-semibold text-gray-900">Create New Event</h1>
                        </div>

                        <div className="flex items-center gap-3">
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
                    <EventForm
                        onSuccess={(eventId) => {
                            // Redirect to the event page or back to staff dashboard
                            window.location.href = `/staff/events/${eventId}`
                        }}
                        onCancel={() => {
                            window.location.href = '/staff'
                        }}
                    />
                </div>
            </main>
        </div>
    )
} 