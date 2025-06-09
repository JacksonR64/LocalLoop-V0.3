import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
        resend_api_key: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
        node_env: process.env.NODE_ENV,
        // OAuth Debug Info
        google_redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
        next_public_app_url: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
        next_public_base_url: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
        google_client_id: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
        google_client_secret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
        has_env_local: 'Check if .env.local is being loaded'
    })
} 