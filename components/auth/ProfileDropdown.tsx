'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogOut, ChevronDown, Settings, Calendar, BarChart3 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useAuth as useAuthHook } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()
  const { user: userProfile, isStaff, isAdmin } = useAuthHook()
  const router = useRouter()

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User'
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
      >
        <User className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{getUserDisplayName()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            {userProfile?.role && (
              <p className="text-xs text-blue-600 capitalize font-medium mt-1">
                {userProfile.role}
              </p>
            )}
          </div>

          {/* My Events Link */}
          <Link
            href="/my-events"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            My Events
          </Link>

          {/* Staff Dashboard Link - Only for organizers and admins */}
          {isStaff && (
            <Link
              href="/staff"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              {isAdmin ? <Settings className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
              {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
            </Link>
          )}

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
} 