import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
        resend_api_key: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
        node_env: process.env.NODE_ENV,
        has_env_local: 'Check if .env.local is being loaded'
    })
} 