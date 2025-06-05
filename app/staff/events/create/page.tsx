import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import StaffEventCreateClient from './StaffEventCreateClient'

export default async function StaffEventCreatePage() {
    const supabase = await createServerSupabaseClient()

    // Check authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/auth/login')
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, display_name, email')
        .eq('id', user.id)
        .single()

    if (userError || !userData || (userData.role !== 'organizer' && userData.role !== 'admin')) {
        redirect('/')
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
                            <div className="text-right">
                                <div className="text-sm text-gray-900 font-medium">
                                    {userData.display_name || userData.email}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                    {userData.role}
                                </div>
                            </div>
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {(userData.display_name || userData.email || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <StaffEventCreateClient />
                </div>
            </main>
        </div>
    )
} 