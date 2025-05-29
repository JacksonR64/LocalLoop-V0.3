// Feature toggles and configuration
export const config = {
    // Authentication providers
    auth: {
        enableGoogle: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH !== 'false',
        enableApple: process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === 'true',
    },

    // Supabase configuration
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },

    // Google Calendar API
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
} as const

// Feature flag helpers
export const isFeatureEnabled = {
    googleAuth: () => config.auth.enableGoogle,
    appleAuth: () => config.auth.enableApple,
} as const 