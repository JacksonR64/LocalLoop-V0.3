'use client'

import React, { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--muted)] transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            data-test-id="theme-toggle"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[var(--foreground)]" />
            ) : (
                <Moon className="w-5 h-5 text-[var(--foreground)]" />
            )}
        </button>
    )
} 