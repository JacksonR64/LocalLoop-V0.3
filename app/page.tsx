"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Menu, X } from 'lucide-react';
import { Card, CardContent, LoadingSpinner } from '@/components/ui';
import { EventCard, type EventData } from '@/components/events';
import { EventFilters } from '@/components/filters/EventFilters';
import { usePagination } from '@/lib/hooks/usePagination';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { useAuth } from '@/lib/auth-context';
import { ProfileDropdown } from '@/components/auth/ProfileDropdown';
import React from 'react';

// Sample event data (will be replaced with real data from Supabase in future tasks)
// Moved outside component to prevent recreation on every render
const sampleEvents: EventData[] = [
  {
    id: '1',
    title: 'Community Garden Cleanup',
    description: 'Join us for a morning of community service cleaning up the local garden.',
    short_description: 'Help clean up our community garden this Saturday morning.',
    start_time: '2025-05-05T10:00:00.000Z',
    end_time: '2025-05-05T14:00:00.000Z',
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
    start_time: '2025-05-12T18:00:00.000Z',
    end_time: '2025-05-12T20:00:00.000Z',
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
    start_time: '2025-05-20T14:00:00.000Z',
    end_time: '2025-05-20T16:00:00.000Z',
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
  },
  {
    id: '4',
    title: 'Tech Meetup: AI & Startups',
    description: 'A networking and knowledge-sharing event for AI enthusiasts and startup founders.',
    short_description: 'Meet local AI experts and startup founders.',
    start_time: '2025-06-03T18:30:00.000Z',
    end_time: '2025-06-03T21:00:00.000Z',
    location: 'Innovation Hub',
    category: 'tech',
    is_paid: false,
    featured: false,
    capacity: 50,
    rsvp_count: 30,
    image_url: null,
    organizer: { display_name: 'Tech Community' }
  },
  {
    id: '5',
    title: 'Yoga in the Park',
    description: 'Outdoor yoga session for all levels. Bring your own mat!',
    short_description: 'Morning yoga session in the city park.',
    start_time: '2025-06-10T07:00:00.000Z',
    end_time: '2025-06-10T08:30:00.000Z',
    location: 'Central Park',
    category: 'wellness',
    is_paid: false,
    featured: true,
    capacity: 40,
    rsvp_count: 22,
    image_url: null,
    organizer: { display_name: 'Wellness Group' }
  },
  {
    id: '6',
    title: 'Board Game Night',
    description: 'Bring your favorite board games or try something new. Snacks provided!',
    short_description: 'Casual board game night for all ages.',
    start_time: '2025-06-17T19:00:00.000Z',
    end_time: '2025-06-17T22:00:00.000Z',
    location: 'Community Hall',
    category: 'social',
    is_paid: false,
    featured: false,
    capacity: 25,
    rsvp_count: 10,
    image_url: null,
    organizer: { display_name: 'Fun Club' }
  },
  {
    id: '7',
    title: 'Startup Pitch Night',
    description: 'Watch local startups pitch their ideas to a panel of investors and experts.',
    short_description: 'Startup pitches and networking.',
    start_time: '2025-06-24T18:00:00.000Z',
    end_time: '2025-06-24T21:00:00.000Z',
    location: 'Tech Auditorium',
    category: 'business',
    is_paid: true,
    featured: true,
    capacity: 100,
    rsvp_count: 60,
    image_url: null,
    organizer: { display_name: 'Startup Society' }
  },
  {
    id: '8',
    title: 'Outdoor Movie Night',
    description: 'Enjoy a family-friendly movie under the stars. Bring blankets and snacks!',
    short_description: 'Movie screening in the park.',
    start_time: '2025-07-01T20:00:00.000Z',
    end_time: '2025-07-01T22:30:00.000Z',
    location: 'Riverside Park',
    category: 'entertainment',
    is_paid: false,
    featured: false,
    capacity: 200,
    rsvp_count: 80,
    image_url: null,
    organizer: { display_name: 'City Events' }
  },
  {
    id: '9',
    title: 'Food Truck Festival',
    description: 'Sample delicious food from a variety of local food trucks. Live music and games!',
    short_description: 'Food trucks, music, and fun.',
    start_time: '2025-07-08T12:00:00.000Z',
    end_time: '2025-07-08T18:00:00.000Z',
    location: 'Market Square',
    category: 'food',
    is_paid: true,
    featured: true,
    capacity: 500,
    rsvp_count: 200,
    image_url: null,
    organizer: { display_name: 'Foodies United' }
  },
  {
    id: '10',
    title: 'Photography Walk',
    description: 'Join local photographers for a guided walk and photo session around the city.',
    short_description: 'Explore the city through your lens.',
    start_time: '2025-07-15T09:00:00.000Z',
    end_time: '2025-07-15T12:00:00.000Z',
    location: 'City Center',
    category: 'arts',
    is_paid: false,
    featured: false,
    capacity: 30,
    rsvp_count: 18,
    image_url: null,
    organizer: { display_name: 'Photo Club' }
  },
  {
    id: '11',
    title: 'Coding Bootcamp Demo Day',
    description: 'See what our bootcamp students have built and network with local tech companies.',
    short_description: 'Bootcamp project demos and networking.',
    start_time: '2025-07-22T15:00:00.000Z',
    end_time: '2025-07-22T18:00:00.000Z',
    location: 'Innovation Hub',
    category: 'tech',
    is_paid: false,
    featured: false,
    capacity: 80,
    rsvp_count: 40,
    image_url: null,
    organizer: { display_name: 'Code Academy' }
  },
  {
    id: '12',
    title: 'Charity Fun Run',
    description: '5K fun run to raise money for local charities. All ages welcome!',
    short_description: 'Run, walk, or cheer for a good cause.',
    start_time: '2025-07-29T08:00:00.000Z',
    end_time: '2025-07-29T11:00:00.000Z',
    location: 'River Trail',
    category: 'community',
    is_paid: true,
    featured: true,
    capacity: 300,
    rsvp_count: 120,
    image_url: null,
    organizer: { display_name: 'Charity League' }
  },
  {
    id: '13',
    title: 'Makers Market',
    description: 'Shop handmade goods from local makers and artists. Live demos and workshops.',
    short_description: 'Handmade goods, demos, and workshops.',
    start_time: '2025-07-31T10:00:00.000Z',
    end_time: '2025-07-31T16:00:00.000Z',
    location: 'Old Town Square',
    category: 'market',
    is_paid: false,
    featured: false,
    capacity: 100,
    rsvp_count: 55,
    image_url: null,
    organizer: { display_name: 'Makers Guild' }
  }
];

// Main Page Component
export default function HomePage() {
  const router = useRouter();
  const featuredEvents = sampleEvents.filter(event => event.featured);

  // Memoize non-featured events to prevent recreation on every render
  const nonFeaturedEvents = React.useMemo(() =>
    sampleEvents.filter(event => !event.featured), []
  );

  const [filteredEvents, setFilteredEvents] = React.useState(nonFeaturedEvents);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Auth state
  const { user, loading: authLoading } = useAuth();

  // Memoize the filtered events setter to prevent infinite re-renders
  const handleFilteredEventsChange = React.useCallback((events: EventData[]) => {
    setFilteredEvents(events);
  }, []);

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

  // Event click handler - navigate to event detail page
  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  // Category filter handler for hero pills
  const handleCategoryFilter = (category: string) => {
    // Filter events by category and update filtered events
    const categoryFiltered = sampleEvents.filter(event =>
      !event.featured && event.category.toLowerCase() === category.toLowerCase()
    );
    handleFilteredEventsChange(categoryFiltered);

    // Scroll to upcoming events section
    const upcomingSection = document.getElementById('upcoming-events');
    if (upcomingSection) {
      upcomingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // View all events handler
  const handleViewAll = () => {
    handleFilteredEventsChange(sampleEvents.filter(event => !event.featured));
    const upcomingSection = document.getElementById('upcoming-events');
    if (upcomingSection) {
      upcomingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">LocalLoop</h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => handleViewAll()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Browse Events
              </button>
              <Link href="/create-event" className="text-gray-600 hover:text-gray-900 transition-colors">
                Create Event
              </Link>
              <Link href="/my-events" className="text-gray-600 hover:text-gray-900 transition-colors">
                My Events
              </Link>

              {/* Auth state conditional rendering */}
              {authLoading ? (
                <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
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
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    handleViewAll();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2 text-left"
                >
                  Browse Events
                </button>
                <Link
                  href="/create-event"
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Event
                </Link>
                <Link
                  href="/my-events"
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Events
                </Link>

                {/* Auth state conditional rendering for mobile */}
                {authLoading ? (
                  <div className="w-full h-12 bg-gray-200 animate-pulse rounded-lg"></div>
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
                events={nonFeaturedEvents}
                onFilteredEventsChange={handleFilteredEventsChange}
                showSearch={true}
                showActiveFilters={true}
                layout="horizontal"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-sm px-4">
              <button
                onClick={() => handleCategoryFilter('workshop')}
                className="bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Workshop
              </button>
              <button
                onClick={() => handleCategoryFilter('community')}
                className="bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Community
              </button>
              <button
                onClick={() => handleCategoryFilter('arts')}
                className="bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Arts
              </button>
              <button
                onClick={() => handleCategoryFilter('business')}
                className="bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Business
              </button>
              <button
                onClick={() => handleCategoryFilter('family')}
                className="bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Family
              </button>
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
                <EventCard
                  key={event.id}
                  event={event}
                  size="lg"
                  featured={true}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section id="upcoming-events">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Upcoming Events</h3>
            <button
              onClick={handleViewAll}
              className="text-blue-600 hover:text-blue-800 font-medium text-left sm:text-right"
            >
              View All →
            </button>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-gray-500 px-4">
              <p className="mb-4 text-base sm:text-lg">No events match your search or filters.</p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"
                onClick={handleViewAll}
              >
                Show All Events
              </button>
              <p className="text-sm">Try adjusting your search or filter criteria to find more events.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedUpcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    size="md"
                    onClick={() => handleEventClick(event.id)}
                  />
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
            <Link href="/" className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold">LocalLoop</h4>
            </Link>
            <p className="text-gray-400 mb-6">
              Connecting communities through local events
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/about" className="text-gray-400 hover:text-white">About</Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
