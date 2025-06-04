"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Menu, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { EventCard, type EventData } from '@/components/events';
import { EventFilters } from '@/components/filters/EventFilters';
import { usePagination } from '@/lib/hooks/usePagination';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { useAuth } from '@/lib/auth-context';
import { ProfileDropdown } from '@/components/auth/ProfileDropdown';

interface HomePageClientProps {
  featuredEvents: EventData[];
  nonFeaturedEvents: EventData[];
}

export function HomePageClient({ featuredEvents, nonFeaturedEvents }: HomePageClientProps) {
  const router = useRouter();
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
    const allEvents = [...featuredEvents, ...nonFeaturedEvents];
    const categoryFiltered = allEvents.filter(event =>
      !event.featured && event.category && event.category.toLowerCase() === category.toLowerCase()
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
    handleFilteredEventsChange(nonFeaturedEvents);
    const upcomingSection = document.getElementById('upcoming-events');
    if (upcomingSection) {
      upcomingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
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
    </>
  );
} 