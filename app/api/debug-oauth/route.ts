import { NextResponse } from 'next/server'
import { createGoogleCalendarService } from '@/lib/google-calendar'

export async function GET() {
    try {
        const googleCalendarService = createGoogleCalendarService()
        const authUrl = googleCalendarService.getAuthUrl('debug-test')

        return NextResponse.json({
            success: true,
            authUrl,
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
                GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
            }
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
                GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
            }
        })
    }
} 