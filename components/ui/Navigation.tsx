'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Menu, X, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAuth as useAuthHook } from '@/lib/hooks/useAuth'
import { ProfileDropdown } from '@/components/auth/ProfileDropdown'

interface NavigationProps {
    variant?: 'full' | 'simple'
    showBackButton?: boolean
    backButtonText?: string
    backButtonHref?: string
    title?: string
    className?: string
}

export function Navigation({
    variant = 'full',
    showBackButton = false,
    backButtonText = 'Back to Home',
    backButtonHref = '/',
    title,
    className = ''
}: NavigationProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user, loading: authLoading } = useAuth()
    const { isStaff, isAdmin } = useAuthHook()
    const router = useRouter()

    // Handle navigation click for browse events
    const handleBrowseEvents = () => {
        router.push('/')
        // If on homepage, scroll to events section
        setTimeout(() => {
            const eventsSection = document.getElementById('upcoming-events')
            if (eventsSection) {
                eventsSection.scrollIntoView({ behavior: 'smooth' })
            }
        }, 100)
    }

    return (
        <header className={`bg-white shadow-sm border-b sticky top-0 z-50 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Logo and optional back button */}
                    <div className="flex items-center gap-4">
                        {showBackButton && (
                            <>
                                <Link
                                    href={backButtonHref}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">{backButtonText}</span>
                                    <span className="sm:hidden">Back</span>
                                </Link>
                                {title && (
                                    <>
                                        <div className="h-6 w-px bg-gray-300" />
                                        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                                    </>
                                )}
                            </>
                        )}

                        {!showBackButton && (
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">LocalLoop</h1>
                            </Link>
                        )}
                    </div>

                    {/* Right side content */}
                    {variant === 'full' ? (
                        <>
                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex items-center gap-6">
                                <button
                                    onClick={handleBrowseEvents}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Browse Events
                                </button>

                                {(isStaff || isAdmin) && (
                                    <Link href="/create-event" className="text-gray-600 hover:text-gray-900 transition-colors">
                                        Create Event
                                    </Link>
                                )}

                                <Link href="/my-events" className="text-gray-600 hover:text-gray-900 transition-colors">
                                    My Events
                                </Link>

                                {/* Auth state conditional rendering */}
                                {authLoading ? (
                                    <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg" />
                                ) : user ? (
                                    <ProfileDropdown />
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </nav>

                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Toggle mobile menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6 text-gray-600" />
                                ) : (
                                    <Menu className="w-6 h-6 text-gray-600" />
                                )}
                            </button>
                        </>
                    ) : (
                        /* Simple variant - just auth/back button */
                        <div className="flex items-center gap-3">
                            {authLoading ? (
                                <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg" />
                            ) : user ? (
                                <ProfileDropdown />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Navigation - only for full variant */}
                {variant === 'full' && isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 py-4">
                        <nav className="flex flex-col space-y-4">
                            <button
                                onClick={() => {
                                    handleBrowseEvents()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-left"
                            >
                                Browse Events
                            </button>

                            {(isStaff || isAdmin) && (
                                <Link
                                    href="/create-event"
                                    className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Create Event
                                </Link>
                            )}

                            <Link
                                href="/my-events"
                                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                My Events
                            </Link>

                            {/* Auth state conditional rendering for mobile */}
                            {authLoading ? (
                                <div className="w-full h-12 bg-gray-200 animate-pulse rounded-lg" />
                            ) : user ? (
                                <ProfileDropdown />
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
} 