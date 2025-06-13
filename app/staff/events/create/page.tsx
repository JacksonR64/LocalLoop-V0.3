import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
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
            {/* Main Content */}
            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
                        <p className="mt-2 text-gray-600">Create and manage your event details</p>
                    </div>
                    <StaffEventCreateClient />
                </div>
            </main>
        </div>
    )
} 