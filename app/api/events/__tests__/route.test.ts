/**
 * @jest-environment node
 */

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient: jest.fn(() => ({
        auth: {
            getUser: jest.fn()
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            // Chain methods should return the final result
            then: jest.fn((callback) => callback({ data: [], error: null, count: 0 }))
        })),
    }))
}))

// Mock cache utilities
jest.mock('@/lib/utils/cache', () => ({
    withCache: jest.fn((key, fetcher) => fetcher()),
    cacheKeys: {
        events: {
            list: jest.fn((filters) => `events:list:${JSON.stringify(filters || {})}`),
            detail: jest.fn((id) => `events:detail:${id}`),
            userRsvps: jest.fn((userId) => `events:user_rsvps:${userId}`),
            ticketTypes: jest.fn((eventId) => `events:ticket_types:${eventId}`),
        },
        users: {
            profile: jest.fn((id) => `users:profile:${id}`),
            googleConnection: jest.fn((id) => `users:google:${id}`),
        },
        stats: {
            eventAttendees: jest.fn((eventId) => `stats:attendees:${eventId}`),
            userEventHistory: jest.fn((userId) => `stats:user_history:${userId}`),
        },
    },
    invalidateEventCache: jest.fn(),
    CACHE_TTL: {
        SHORT: 60000,
        MEDIUM: 300000,
        LONG: 1800000,
        VERY_LONG: 3600000
    }
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

describe('/api/events', () => {
    let mockCreateServerSupabaseClient: jest.MockedFunction<() => unknown>
    let mockAuth: { getUser: jest.MockedFunction<() => Promise<{ data: { user: unknown }, error: unknown }>> }
    let mockQuery: Record<string, jest.MockedFunction<unknown>>

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createServerSupabaseClient } = require('@/lib/supabase-server')
        mockCreateServerSupabaseClient = createServerSupabaseClient

        // Setup mock auth
        mockAuth = {
            getUser: jest.fn()
        }

        // Setup mock query builder
        mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            // Mock the promise resolution for the query chain
            then: jest.fn((callback) => callback({ data: [], error: null, count: 0 }))
        }

        mockCreateServerSupabaseClient.mockReturnValue({
            auth: mockAuth,
            from: jest.fn(() => mockQuery),
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should return 401 when user is not authenticated', async () => {
        // Mock no user
        mockAuth.getUser.mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated')
        })

        const request = new NextRequest('http://localhost:3000/api/events')

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
    })

    it('should return events when user is authenticated', async () => {
        // Mock authenticated user
        const mockUser = {
            id: 'user-id',
            email: 'test@example.com'
        }

        mockAuth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null
        })

        // Mock successful query result
        mockQuery.then.mockImplementation((callback) => callback({
            data: [],
            error: null,
            count: 0
        }))

        const request = new NextRequest('http://localhost:3000/api/events')

        const response = await GET(request)

        expect(response.status).toBe(200)
        expect(mockCreateServerSupabaseClient).toHaveBeenCalled()
    })
}) 