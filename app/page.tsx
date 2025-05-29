"use client";

import { Suspense } from 'react';
import { Calendar, Menu, X } from 'lucide-react';
import { Card, CardContent, LoadingSpinner } from '@/components/ui';
import { EventCard, type EventData } from '@/components/events';
import { EventFilters } from '@/components/filters/EventFilters';
import { usePagination } from '@/lib/hooks/usePagination';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import React from 'react';

// Sample event data (will be replaced with real data from Supabase in future tasks)
const sampleEvents: EventData[] = [
  {
    id: '1',
    title: 'Community Garden Cleanup',
    description: 'Join us for a morning of community service cleaning up the local garden.',
    short_description: 'Help clean up our community garden this Saturday morning.',
    start_time: '2024-01-20T10:00:00.000Z',
    end_time: '2024-01-20T14:00:00.000Z',
    location: 'Sunset Community Garden',
    category: 'community',
    is_paid: false,
    featured: true,
    capacity: 25,
    rsvp_count: 12,
    image_url: null,
    organizer: {
      display_name: 'Garden Committee'
    }
  },
  {
    id: '2',
    title: 'Local Business Networking',
    description: 'Connect with other local business owners and entrepreneurs.',
    short_description: 'Network with local business owners over coffee and pastries.',
    start_time: '2024-01-22T18:00:00.000Z',
    end_time: '2024-01-22T20:00:00.000Z',
    location: 'Downtown Coffee Co.',
    category: 'business',
    is_paid: true,
    featured: false,
    capacity: 15,
    rsvp_count: 8,
    image_url: null,
    organizer: {
      display_name: 'Chamber of Commerce'
    }
  },
  {
    id: '3',
    title: 'Kids Art Workshop',
    description: 'Creative art workshop for children ages 6-12 with professional instructors.',
    short_description: 'Fun art workshop for kids with painting and crafts.',
    start_time: '2024-01-24T14:00:00.000Z',
    end_time: '2024-01-24T16:00:00.000Z',
    location: 'Community Center',
    category: 'arts',
    is_paid: true,
    featured: true,
    capacity: 20,
    rsvp_count: 15,
    image_url: null,
    organizer: {
      display_name: 'Arts Alliance'
    }
  }
];

// Main Page Component
export default function HomePage() {
  const featuredEvents = sampleEvents.filter(event => event.featured);
  const [filteredEvents, setFilteredEvents] = React.useState(sampleEvents.filter(event => !event.featured));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Pagination for upcoming events
  const {
    paginatedData: paginatedUpcomingEvents,
    loadMore,
    state: paginationState
  } = usePagination({
    data: filteredEvents,
    pageSize: 8
  });

  // Infinite scroll setup
  const { loadingTriggerRef } = useInfiniteScroll({
    loadMore,
    hasMore: paginationState.hasMore,
    isLoading: paginationState.isLoading,
    threshold: 300
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">LocalLoop</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Browse Events</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Create Event</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">My Events</a>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </button>
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
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors py-2">Browse Events</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors py-2">Create Event</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors py-2">My Events</a>
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left">
                  Sign In
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Discover Local Events
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl mb-6 sm:mb-8 text-blue-100 max-w-3xl mx-auto px-4">
              Connect with your community through amazing local events. From workshops to social gatherings, find your next adventure.
            </p>
            {/* EventFilters Integration */}
            <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
              <EventFilters
                events={sampleEvents.filter(event => !event.featured)}
                onFilteredEventsChange={setFilteredEvents}
                showSearch={true}
                showActiveFilters={true}
                layout="horizontal"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-sm px-4">
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">Workshop</span>
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">Community</span>
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">Arts</span>
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">Business</span>
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full">Family</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Featured Events</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} size="lg" featured={true} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Upcoming Events</h3>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-left sm:text-right">
              View All →
            </button>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-gray-500 px-4">
              <p className="mb-4 text-base sm:text-lg">No events match your search or filters.</p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"
                onClick={() => window.location.reload()}
              >
                Clear All Filters
              </button>
              <p className="text-sm">Try adjusting your search or filter criteria to find more events.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedUpcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} size="md" />
                ))}
              </div>

              {/* Infinite Scroll Loading Trigger */}
              <div ref={loadingTriggerRef} className="mt-6 sm:mt-8">
                {paginationState.isLoading && (
                  <LoadingSpinner
                    size="md"
                    text="Loading more events..."
                    className="py-6 sm:py-8"
                  />
                )}
                {!paginationState.hasMore && paginatedUpcomingEvents.length > 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <p>You&apos;ve reached the end of the events list.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Loading State Placeholder */}
        <Suspense fallback={
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          {/* Future: Real data loading will go here */}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold">LocalLoop</h4>
            </div>
            <p className="text-gray-400 mb-6">
              Connecting communities through local events
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white">About</a>
              <a href="#" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
