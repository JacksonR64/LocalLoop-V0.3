import { lazy, ComponentType, LazyExoticComponent } from 'react'

// Lazy loading utility with better error handling
export function lazyLoad<T extends ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: ComponentType<any>
): LazyExoticComponent<T> {
    return lazy(async () => {
        try {
            const component = await importFunc()
            return component
        } catch (error) {
            console.error('Failed to load component:', error)
            // Return fallback component or minimal error component
            if (fallback) {
                return { default: fallback }
            }
            return {
                default: (() => (
                    <div className= "p-4 text-center text-gray-500" >
                    Failed to load component
                    </ div >
                )) as T
}
        }
    })
}

// Debounce utility for search and input optimization
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

// Throttle utility for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

// Intersection Observer utility for lazy loading images/components
export function createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
): IntersectionObserver | null {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
        return null
    }

    const defaultOptions: IntersectionObserverInit = {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
    }

    return new IntersectionObserver(callback, defaultOptions)
}

// Preload critical resources
export function preloadResource(href: string, as: string, type?: string) {
    if (typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    link.crossOrigin = 'anonymous'

    document.head.appendChild(link)
}

// Image optimization utility
export function optimizeImageUrl(
    src: string,
    width?: number,
    quality: number = 75
): string {
    if (!src) return ''

    // For Next.js Image optimization
    if (src.startsWith('/') || src.startsWith('http')) {
        const params = new URLSearchParams()
        if (width) params.set('w', width.toString())
        params.set('q', quality.toString())

        return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`
    }

    return src
}

// Memory usage monitoring (browser only)
export function getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
} | null {
    if (typeof window === 'undefined' || !(performance as any).memory) {
        return null
    }

    const memory = (performance as any).memory
    return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    }
}

// Bundle size analyzer helper
export function logBundleSize(componentName: string) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`📦 ${componentName} loaded`, {
            timestamp: new Date().toISOString(),
            memory: getMemoryUsage(),
            url: window.location.pathname
        })
    }
}

// Critical resource hints
export function addResourceHints() {
    if (typeof document === 'undefined') return

    const hints = [
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//www.googletagmanager.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
    ]

    hints.forEach(hint => {
        const link = document.createElement('link')
        link.rel = hint.rel
        link.href = hint.href
        if ('crossorigin' in hint) {
            link.crossOrigin = 'anonymous'
        }
        document.head.appendChild(link)
    })
}
