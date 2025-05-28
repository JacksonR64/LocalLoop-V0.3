import { createBrowserClient } from '@supabase/ssr'

// Fallback values for build time when environment variables might not be available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key'

export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Default client for client-side usage
export const supabase = createClient() 