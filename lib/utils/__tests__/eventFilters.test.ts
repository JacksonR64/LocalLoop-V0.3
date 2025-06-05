import {
  applyFilters,
  getEventCategories,
  getEventPriceCounts,
  getActiveFilters,
  hasActiveFilters,
  getFilterSummary,
  filtersToQueryParams,
  queryParamsToFilters
} from '@/lib/utils/eventFilters'
import { EventData } from '@/components/events'
import { EventFilters } from '@/lib/types/filters'

// Mock event data
const mockEvents: EventData[] = [
  {
    id: '1',
    title: 'Tech Conference 2024',
    description: 'Annual technology conference with networking opportunities',
    short_description: 'Tech event',
    location: 'San Francisco, CA',
    start_time: '2024-06-15T10:00:00Z',
    end_time: '2024-06-15T18:00:00Z',
    category: 'technology',
    is_paid: true,
    ticket_types: [{ id: '1', price: 2500 }],
    organizer: { display_name: 'Tech Corp' }
  },
  {
    id: '2',
    title: 'Music Festival',
    description: 'Free outdoor music festival',
    short_description: 'Music event',
    location: 'New York, NY',
    start_time: '2024-07-20T14:00:00Z',
    end_time: '2024-07-20T22:00:00Z',
    category: 'music',
    is_paid: false,
    ticket_types: [],
    organizer: { display_name: 'Music Collective' }
  },
  {
    id: '3',
    title: 'Art Gallery Opening',
    description: 'Contemporary art exhibition opening with artists',
    short_description: 'Art opening',
    location: 'Los Angeles, CA',
    start_time: '2024-05-10T19:00:00Z',
    end_time: '2024-05-10T21:00:00Z',
    category: 'art',
    is_paid: true,
    ticket_types: [{ id: '2', price: 2500 }],
    organizer: { display_name: 'Art Gallery' }
  },
  {
    id: '4',
    title: 'Startup Meetup',
    description: 'Networking event for startup founders',
    short_description: 'Startup networking',
    location: 'San Francisco, CA',
    start_time: '2024-06-01T18:00:00Z',
    end_time: '2024-06-01T20:00:00Z',
    category: 'business',
    is_paid: false,
    ticket_types: [],
    organizer: { display_name: 'Startup Hub' }
  }
] as EventData[]

describe('Event Filters', () => {
  describe('applyFilters', () => {
    it('should return all events with empty filters', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      const result = applyFilters(mockEvents, filters)
      expect(result).toHaveLength(4)
    })

    it('should filter by categories', () => {
      const filters: EventFilters = {
        categories: ['technology'],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      const result = applyFilters(mockEvents, filters)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should filter by price type (free)', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'free',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      const result = applyFilters(mockEvents, filters)
      expect(result).toHaveLength(2)
      expect(result.map(e => e.id)).toEqual(['4', '2'])
    })

    it('should filter by price type (paid)', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'paid',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      const result = applyFilters(mockEvents, filters)
      expect(result).toHaveLength(2)
      expect(result.map(e => e.id)).toEqual(['3', '1'])
    })

    it('should filter by search query', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: 'conference'
      }
      const result = applyFilters(mockEvents, filters)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should sort by date ascending', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      const result = applyFilters(mockEvents, filters)
      expect(result[0].id).toBe('3') // May 10
      expect(result[1].id).toBe('4') // June 1
      expect(result[2].id).toBe('1') // June 15
      expect(result[3].id).toBe('2') // July 20
    })

    it('should sort by date descending', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_desc',
        searchQuery: ''
      }
      const result = applyFilters(mockEvents, filters)
      expect(result[0].id).toBe('2') // July 20
      expect(result[3].id).toBe('3') // May 10
    })

    it('should sort by title ascending', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'title_asc',
        searchQuery: ''
      }
      const result = applyFilters(mockEvents, filters)
      expect(result[0].title).toBe('Art Gallery Opening')
      expect(result[1].title).toBe('Music Festival')
    })

    it('should combine multiple filters', () => {
      const filters: EventFilters = {
        categories: ['technology'],
        dateRange: null,
        priceType: 'paid',
        sortBy: 'date_asc',
        searchQuery: 'tech'
      }
      const result = applyFilters(mockEvents, filters)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })
  })

  describe('getEventCategories', () => {
    it('should return unique categories with counts', () => {
      const categories = getEventCategories(mockEvents)
      expect(categories).toHaveLength(4)

      const techCategory = categories.find(c => c.value === 'technology')
      expect(techCategory).toBeDefined()
      expect(techCategory?.count).toBe(1)
      expect(techCategory?.label).toBe('Technology')
    })

    it('should handle empty events array', () => {
      const categories = getEventCategories([])
      expect(categories).toHaveLength(0)
    })

    it('should sort categories alphabetically', () => {
      const categories = getEventCategories(mockEvents)
      const labels = categories.map(c => c.label)
      expect(labels).toEqual([...labels].sort())
    })
  })

  describe('getEventPriceCounts', () => {
    it('should count free and paid events', () => {
      const counts = getEventPriceCounts(mockEvents)
      expect(counts.free).toBe(2)
      expect(counts.paid).toBe(2)
      expect(counts.total).toBe(4)
    })

    it('should handle empty events array', () => {
      const counts = getEventPriceCounts([])
      expect(counts.free).toBe(0)
      expect(counts.paid).toBe(0)
      expect(counts.total).toBe(0)
    })

    it('should handle all free events', () => {
      const freeEvents = mockEvents.filter(e => !e.is_paid)
      const counts = getEventPriceCounts(freeEvents)
      expect(counts.free).toBe(2)
      expect(counts.paid).toBe(0)
      expect(counts.total).toBe(2)
    })
  })

  describe('hasActiveFilters', () => {
    it('should return false for empty filters', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      expect(hasActiveFilters(filters)).toBe(false)
    })

    it('should return true when categories are selected', () => {
      const filters: EventFilters = {
        categories: ['technology'],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      expect(hasActiveFilters(filters)).toBe(true)
    })

    it('should return true when price type is filtered', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'free',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      expect(hasActiveFilters(filters)).toBe(true)
    })

    it('should return true when search query is present', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: 'conference'
      }
      expect(hasActiveFilters(filters)).toBe(true)
    })
  })

  describe('getFilterSummary', () => {
    it('should generate filter summary', () => {
      const summary = getFilterSummary(10, 5, {
        categories: ['technology'],
        dateRange: null,
        priceType: 'paid',
        sortBy: 'date_asc',
        searchQuery: 'conference'
      })
      expect(summary).toContain('5 of 10 events')
    })

    it('should handle no filters applied', () => {
      const summary = getFilterSummary(10, 10, {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: ''
      })
      expect(summary).toContain('10 events')
    })
  })

  describe('filtersToQueryParams', () => {
    it('should convert filters to query params', () => {
      const filters: EventFilters = {
        categories: ['technology', 'music'],
        dateRange: null,
        priceType: 'paid',
        sortBy: 'date_desc',
        searchQuery: 'conference'
      }
      const params = filtersToQueryParams(filters)
      expect(params.get('categories')).toBe('technology,music')
      expect(params.get('priceType')).toBe('paid')
      expect(params.get('sortBy')).toBe('date_desc')
      expect(params.get('search')).toBe('conference')
    })

    it('should skip empty values', () => {
      const filters: EventFilters = {
        categories: [],
        dateRange: null,
        priceType: 'all',
        sortBy: 'date_asc',
        searchQuery: ''
      }
      const params = filtersToQueryParams(filters)
      expect(params.toString()).toBe('')
    })
  })

  describe('queryParamsToFilters', () => {
    it('should convert query params to filters', () => {
      const params = new URLSearchParams('categories=music,sports&priceType=free&sortBy=title_asc&search=concert')
      const filters = queryParamsToFilters(params)
      expect(filters.categories).toEqual(['music', 'sports'])
      expect(filters.priceType).toBe('free')
      expect(filters.sortBy).toBe('title_asc')
      expect(filters.searchQuery).toBe('concert')
    })

    it('should handle empty params', () => {
      const params = new URLSearchParams()
      const filters = queryParamsToFilters(params)
      // Function returns partial object - undefined properties are expected
      expect(filters.categories).toBeUndefined()
      expect(filters.priceType).toBeUndefined()
      expect(filters.sortBy).toBeUndefined()
      expect(filters.searchQuery).toBeUndefined()
    })
  })
}) 