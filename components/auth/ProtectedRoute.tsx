'use client'

import React from 'react'
import { useAuth, type UserRole } from '@/lib/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRoles?: UserRole[]
    requireAuth?: boolean
    fallbackComponent?: React.ReactNode
    redirectTo?: string
}

export default function ProtectedRoute({
    children,
    requiredRoles = [],
    requireAuth = true,
    fallbackComponent,
    redirectTo = '/auth/login'
}: ProtectedRouteProps) {
    const { user, loading, error, isAuthenticated, refresh } = useAuth()

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="mb-4">{error}</AlertDescription>
                    </Alert>
                    <div className="flex gap-3 mt-4">
                        <Button onClick={refresh} className="flex-1">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">Go Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
        if (fallbackComponent) {
            return <>{fallbackComponent}</>
        }

        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Authentication Required
                    </h2>
                    <p className="text-gray-600 mb-6">
                        You need to sign in to access this page.
                    </p>
                    <div className="flex gap-3">
                        <Button asChild className="flex-1">
                            <Link href={redirectTo}>Sign In</Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">Go Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Check role requirements
    if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
        if (fallbackComponent) {
            return <>{fallbackComponent}</>
        }

        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-600 mb-2">
                        You don&apos;t have permission to access this page.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Required role: {requiredRoles.join(' or ')}. Your role: {user.role}
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/my-events">My Events</Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">Go Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // All checks passed, render children
    return <>{children}</>
}

// Convenience components for specific roles
export function StaffProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['organizer', 'admin']}>
            {children}
        </ProtectedRoute>
    )
}

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['admin']}>
            {children}
        </ProtectedRoute>
    )
}

export function OrganizerProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['organizer', 'admin']}>
            {children}
        </ProtectedRoute>
    )
} 