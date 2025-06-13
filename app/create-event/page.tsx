import { Navigation } from '@/components/ui/Navigation';
// import CreateEventClient from '@/components/events/CreateEventClient';
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';

export default async function CreateEventPage() {
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If user is authenticated, check their role
    if (user) {
        const { data: userDetails } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        // If user has organizer or admin role, redirect to staff event creation
        if (userDetails && (userDetails.role === 'organizer' || userDetails.role === 'admin')) {
            redirect('/staff/events/create')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-12 h-12 text-blue-600" />
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Event Creation
                    </h1>

                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Event creation is available for organizers and administrators.
                        If you need to create events for LocalLoop, please contact us to get organizer access.
                    </p>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Become an Event Organizer
                        </h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            Contact our team to learn about becoming an approved event organizer on LocalLoop.
                        </p>

                        <div className="space-y-3">
                            <Link
                                href="/contact"
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center"
                            >
                                Contact Us
                            </Link>

                            {!user && (
                                <Link
                                    href="/auth/login"
                                    className="w-full bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors inline-block text-center"
                                >
                                    Sign In First
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-sm text-gray-500 mb-4">
                            Already an organizer?
                        </p>
                        <Link
                            href="/staff"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Access Staff Dashboard
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
} 