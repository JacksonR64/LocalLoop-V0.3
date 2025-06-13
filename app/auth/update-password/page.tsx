'use client'

import { Suspense } from 'react'
import UpdatePasswordForm from './update-password-form'
import { Navigation } from '@/components/ui/Navigation'

export default function UpdatePasswordPage() {
    return (
        <>
            <Navigation />
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            }>
                <UpdatePasswordForm />
            </Suspense>
        </>
    )
} 