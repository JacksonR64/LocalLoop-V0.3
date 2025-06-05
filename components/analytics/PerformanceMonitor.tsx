'use client'

import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { initWebVitals, trackPageLoad } from '@/lib/utils/performance'

interface PerformanceMonitorProps {
    pageName?: string
}

export function PerformanceMonitor({ pageName }: PerformanceMonitorProps) {
    useEffect(() => {
        // Initialize Core Web Vitals tracking
        initWebVitals()

        // Track page load performance
        if (pageName) {
            trackPageLoad(pageName)
        }

        // Log analytics initialization in development
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Performance monitoring initialized for:', pageName || 'unknown page')
        }
    }, [pageName])

    return (
        <>
            {/* Vercel Analytics for additional insights */}
            <Analytics />
        </>
    )
}

// Higher-order component to wrap pages with performance monitoring
export function withPerformanceMonitoring<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    pageName: string
) {
    return function PerformanceMonitoredPage(props: P) {
        return (
            <>
                <PerformanceMonitor pageName={pageName} />
                <WrappedComponent {...props} />
            </>
        )
    }
}

export default PerformanceMonitor 