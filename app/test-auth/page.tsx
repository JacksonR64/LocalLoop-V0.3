import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function TestAuthPage() {
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    let userDetails = null
    let userError = null

    if (user) {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, display_name, role')
            .eq('id', user.id)
            .single()

        userDetails = data
        userError = error
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>

            <div className="bg-gray-100 p-4 rounded mb-4">
                <h2 className="font-bold">Auth Status:</h2>
                <p>User: {user ? '✅ Authenticated' : '❌ Not authenticated'}</p>
                {authError && <p className="text-red-500">Auth Error: {authError.message}</p>}
            </div>

            {user && (
                <div className="bg-blue-100 p-4 rounded mb-4">
                    <h2 className="font-bold">User Auth Info:</h2>
                    <p>ID: {user.id}</p>
                    <p>Email: {user.email}</p>
                </div>
            )}

            {userDetails && (
                <div className="bg-green-100 p-4 rounded mb-4">
                    <h2 className="font-bold">User Database Info:</h2>
                    <p>ID: {userDetails.id}</p>
                    <p>Email: {userDetails.email}</p>
                    <p>Display Name: {userDetails.display_name || 'None'}</p>
                    <p><strong>Role: {userDetails.role}</strong></p>
                </div>
            )}

            {userError && (
                <div className="bg-red-100 p-4 rounded mb-4">
                    <h2 className="font-bold">Database Error:</h2>
                    <p>{userError.message}</p>
                </div>
            )}

            <div className="mt-4">
                <p>Staff access requirements:</p>
                <ul className="list-disc pl-6">
                    <li>Must be authenticated ✅</li>
                    <li>Must have role &apos;organizer&apos; or &apos;admin&apos; {userDetails?.role === 'organizer' || userDetails?.role === 'admin' ? '✅' : '❌'}</li>
                </ul>
            </div>

            {userDetails?.role === 'admin' || userDetails?.role === 'organizer' ? (
                <div className="mt-4">
                    <a
                        href="/staff"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Go to Staff Dashboard
                    </a>
                </div>
            ) : (
                <div className="mt-4 text-red-600">
                    <p>❌ You don&apos;t have staff access. Your role is: {userDetails?.role || 'unknown'}</p>
                </div>
            )}
        </div>
    )
} 