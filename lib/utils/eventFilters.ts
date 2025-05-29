// Event Filtering and Sorting Utilities

import { EventData } from '@/components/events';
import {
    EventFilters,
    DateRange,
    SortOption,
    FilterOption,
    ActiveFilter
} from '@/lib/types/filters';

/**
 * Check if a date falls within a date range
 */
function isDateInRange(date: Date, range: DateRange): boolean {
    return date >= range.start && date <= range.end;
}

/**
 * Get the price of an event (returns 0 for free events)
 */
function getEventPrice(event: EventData): number {
    if (!event.is_paid || !event.ticket_types || event.ticket_types.length === 0) {
        return 0;
    }
    // Return the minimum price from ticket types
    return Math.min(...event.ticket_types.map(ticket => ticket.price));
}

/**
 * Filter events based on category selection
 */
function filterByCategories(events: EventData[], categories: string[]): EventData[] {
    if (categories.length === 0) return events;
    return events.filter(event => categories.includes(event.category));
}

/**
 * Filter events based on date range
 */
function filterByDateRange(events: EventData[], dateRange: DateRange | null): EventData[] {
    if (!dateRange) return events;
    return events.filter(event => {
        const eventDate = new Date(event.start_time);
        return isDateInRange(eventDate, dateRange);
    });
}

/**
 * Filter events based on price type (free, paid, or all)
 */
function filterByPriceType(events: EventData[], priceType: 'all' | 'free' | 'paid'): EventData[] {
    if (priceType === 'all') return events;

    return events.filter(event => {
        const isFree = !event.is_paid;
        return priceType === 'free' ? isFree : !isFree;
    });
}

/**
 * Filter events based on search query (searches title, description, and location)
 */
function filterBySearchQuery(events: EventData[], searchQuery: string): EventData[] {
    if (!searchQuery.trim()) return events;

    const query = searchQuery.toLowerCase().trim();
    return events.filter(event => {
        const title = event.title.toLowerCase();
        const description = event.description?.toLowerCase() || '';
        const shortDescription = event.short_description?.toLowerCase() || '';
        const location = event.location?.toLowerCase() || '';
        const organizer = event.organizer?.display_name?.toLowerCase() || '';

        return title.includes(query) ||
            description.includes(query) ||
            shortDescription.includes(query) ||
            location.includes(query) ||
            organizer.includes(query);
    });
}

/**
 * Sort events based on the specified sort option
 */
function sortEvents(events: EventData[], sortBy: SortOption): EventData[] {
    const sortedEvents = [...events];

    switch (sortBy) {
        case 'date_asc':
            return sortedEvents.sort((a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            );
        case 'date_desc':
            return sortedEvents.sort((a, b) =>
                new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
            );
        case 'title_asc':
            return sortedEvents.sort((a, b) =>
                a.title.toLowerCase().localeCompare(b.title.toLowerCase())
            );
        case 'title_desc':
            return sortedEvents.sort((a, b) =>
                b.title.toLowerCase().localeCompare(a.title.toLowerCase())
            );
        case 'price_asc':
            return sortedEvents.sort((a, b) =>
                getEventPrice(a) - getEventPrice(b)
            );
        case 'price_desc':
            return sortedEvents.sort((a, b) =>
                getEventPrice(b) - getEventPrice(a)
            );
        default:
            return sortedEvents;
    }
}

/**
 * Apply all filters and sorting to an array of events
 */
export function applyFilters(events: EventData[], filters: EventFilters): EventData[] {
    let filteredEvents = events;

    // Apply all filters
    filteredEvents = filterByCategories(filteredEvents, filters.categories);
    filteredEvents = filterByDateRange(filteredEvents, filters.dateRange);
    filteredEvents = filterByPriceType(filteredEvents, filters.priceType);

    if (filters.searchQuery) {
        filteredEvents = filterBySearchQuery(filteredEvents, filters.searchQuery);
    }

    // Apply sorting
    filteredEvents = sortEvents(filteredEvents, filters.sortBy);

    return filteredEvents;
}

/**
 * Extract unique categories from events with counts
 */
export function getEventCategories(events: EventData[]): FilterOption[] {
    const categoryMap = new Map<string, number>();

    events.forEach(event => {
        const category = event.category;
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
        .map(([value, count]) => ({
            value,
            label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
            count
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Count events by price type
 */
export function getEventPriceCounts(events: EventData[]): { free: number; paid: number; total: number } {
    const counts = events.reduce(
        (acc, event) => {
            if (event.is_paid) {
                acc.paid++;
            } else {
                acc.free++;
            }
            acc.total++;
            return acc;
        },
        { free: 0, paid: 0, total: 0 }
    );

    return counts;
}

/**
 * Generate active filter objects for display
 */
export function getActiveFilters(
    filters: EventFilters,
    updateFilters: (newFilters: Partial<EventFilters>) => void
): ActiveFilter[] {
    const activeFilters: ActiveFilter[] = [];

    // Category filters
    filters.categories.forEach(category => {
        activeFilters.push({
            type: 'category',
            label: `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            value: category,
            removeFilter: () => {
                updateFilters({
                    categories: filters.categories.filter(c => c !== category)
                });
            }
        });
    });

    // Date range filter
    if (filters.dateRange) {
        const start = filters.dateRange.start.toLocaleDateString();
        const end = filters.dateRange.end.toLocaleDateString();
        const label = start === end ? `Date: ${start}` : `Date: ${start} - ${end}`;

        activeFilters.push({
            type: 'dateRange',
            label,
            value: filters.dateRange,
            removeFilter: () => {
                updateFilters({ dateRange: null });
            }
        });
    }

    // Price type filter
    if (filters.priceType !== 'all') {
        activeFilters.push({
            type: 'priceType',
            label: `Price: ${filters.priceType === 'free' ? 'Free Only' : 'Paid Only'}`,
            value: filters.priceType,
            removeFilter: () => {
                updateFilters({ priceType: 'all' });
            }
        });
    }

    // Search query filter
    if (filters.searchQuery !== undefined && filters.searchQuery.trim()) {
        activeFilters.push({
            type: 'searchQuery',
            label: `Search: "${filters.searchQuery}"`,
            value: filters.searchQuery,
            removeFilter: () => {
                updateFilters({ searchQuery: '' });
            }
        });
    }

    return activeFilters;
}

/**
 * Check if any filters are currently active
 */
export function hasActiveFilters(filters: EventFilters): boolean {
    return (
        filters.categories.length > 0 ||
        filters.dateRange !== null ||
        filters.priceType !== 'all' ||
        (filters.searchQuery !== undefined && filters.searchQuery.trim() !== '')
    );
}

/**
 * Get filter result summary
 */
export function getFilterSummary(
    totalEvents: number,
    filteredEvents: number,
    filters: EventFilters
): string {
    if (!hasActiveFilters(filters)) {
        return `Showing all ${totalEvents} events`;
    }

    if (filteredEvents === 0) {
        return 'No events match your filters';
    }

    if (filteredEvents === totalEvents) {
        return `Showing all ${totalEvents} events`;
    }

    return `Showing ${filteredEvents} of ${totalEvents} events`;
}

/**
 * Serialize filters to URL query parameters
 */
export function filtersToQueryParams(filters: EventFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.categories.length > 0) {
        params.set('categories', filters.categories.join(','));
    }

    if (filters.dateRange) {
        params.set('startDate', filters.dateRange.start.toISOString().split('T')[0]);
        params.set('endDate', filters.dateRange.end.toISOString().split('T')[0]);
    }

    if (filters.priceType !== 'all') {
        params.set('priceType', filters.priceType);
    }

    if (filters.sortBy !== 'date_asc') {
        params.set('sortBy', filters.sortBy);
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
        params.set('search', filters.searchQuery);
    }

    return params;
}

/**
 * Parse filters from URL query parameters
 */
export function queryParamsToFilters(searchParams: URLSearchParams): Partial<EventFilters> {
    const filters: Partial<EventFilters> = {};

    const categories = searchParams.get('categories');
    if (categories) {
        filters.categories = categories.split(',').filter(c => c.trim());
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
        filters.dateRange = {
            start: new Date(startDate),
            end: new Date(endDate)
        };
    }

    const priceType = searchParams.get('priceType');
    if (priceType === 'free' || priceType === 'paid') {
        filters.priceType = priceType;
    }

    const sortBy = searchParams.get('sortBy');
    if (sortBy && ['date_asc', 'date_desc', 'title_asc', 'title_desc', 'price_asc', 'price_desc'].includes(sortBy)) {
        filters.sortBy = sortBy as SortOption;
    }

    const searchQuery = searchParams.get('search');
    if (searchQuery) {
        filters.searchQuery = searchQuery;
    }

    return filters;
} 