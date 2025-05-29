"use client";

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollProps {
    loadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number; // Distance from bottom in pixels
    enabled?: boolean;
}

export function useInfiniteScroll({
    loadMore,
    hasMore,
    isLoading,
    threshold = 200,
    enabled = true
}: UseInfiniteScrollProps) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingTriggerRef = useRef<HTMLDivElement | null>(null);

    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading && enabled) {
                loadMore();
            }
        },
        [loadMore, hasMore, isLoading, enabled]
    );

    useEffect(() => {
        const element = loadingTriggerRef.current;
        if (!element || !enabled) return;

        // Create intersection observer
        observerRef.current = new IntersectionObserver(handleIntersection, {
            rootMargin: `${threshold}px`,
            threshold: 0.1
        });

        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleIntersection, threshold, enabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return {
        loadingTriggerRef,
        observerRef
    };
} 