'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, User, DollarSign, Share2, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { EventData } from '@/components/events';
import { EventMap } from '@/components/events/EventMap';
import { RSVPTicketSection } from '@/components/events/RSVPTicketSection';
import TicketTypeManager from '@/components/events/TicketTypeManager';
import TicketSelection from '@/components/events/TicketSelection';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { GoogleCalendarConnectWithStatus } from '@/components/GoogleCalendarConnect';
import { useAuth } from '@/lib/auth-context';
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createGoogleCalendarAuth } from '@/lib/google-auth'
import type { Event, TicketType } from '@/lib/types'
import EventImageGallery from '@/components/events/EventImageGallery'
import { TicketFilterProvider } from '@/components/filters/TicketFilterContext'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

// Sample event data with CORRECT 2025 dates (matching homepage)
function getSampleEventDetails(eventId: string) {
    const sampleEvents = {
        '1': {
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
        '2': {
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
        '3': {
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
        '4': {
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
        '5': {
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
        '6': {
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
        '7': {
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
        '8': {
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
        '9': {
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
        '10': {
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
        '11': {
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
        'a47ac10b-58cc-4372-a567-0e02b2c3d479': {
            id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Startup Pitch Night',
            description: 'Watch local startups pitch their ideas to a panel of investors and experts.',
            short_description: 'Startup pitches and networking.',
            start_time: '2025-06-24T18:00:00.000Z',
            end_time: '2025-06-24T21:00:00.000Z',
            location: 'Innovation Hub',
            category: 'business',
            is_paid: true,
            featured: true,
            capacity: 100,
            rsvp_count: 60,
            image_url: null,
            organizer: { display_name: 'Startup Society' }
        },
        'a0ddf64f-cf33-8a49-eccf-7379c9aab046': {
            id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046',
            title: 'Local Farmers Market',
            description: 'Shop for fresh, locally grown produce and artisanal goods.',
            short_description: 'Fresh local produce and artisanal goods.',
            start_time: '2025-06-10T08:00:00.000Z',
            end_time: '2025-06-10T14:00:00.000Z',
            location: 'Town Square',
            category: 'food',
            is_paid: true,
            featured: true,
            capacity: 150,
            rsvp_count: 85,
            image_url: null,
            organizer: { display_name: 'Farmers Collective' }
        }
    };

    return sampleEvents[eventId as keyof typeof sampleEvents] || null;
}

// Sample gallery images for the event - Temporarily disabled until proper images are available
// const sampleGalleryImages: EventImage[] = [
//     {
//         url: '/events/farmers-market.jpg',
//         alt: 'Community farmers market with vendors and families',
//         caption: 'Main farmers market area with local vendors',
//         isMain: true
//     },
//     {
//         url: '/events/farmers-market-2.jpg',
//         alt: 'Local produce stands at farmers market',
//         caption: 'Fresh local produce from area farms'
//     },
//     {
//         url: '/events/farmers-market-3.jpg',
//         alt: 'Art and craft vendors at community fair',
//         caption: 'Local artisans showcasing handmade crafts'
//     },
//     {
//         url: '/events/farmers-market-4.jpg',
//         alt: 'Live music performance at farmers market',
//         caption: 'Live music entertainment for all ages'
//     },
//     {
//         url: '/events/farmers-market-5.jpg',
//         alt: 'Families enjoying community event',
//         caption: 'Family-friendly activities and atmosphere'
//     },
//     {
//         url: '/events/farmers-market-6.jpg',
//         alt: 'Food vendors at farmers market',
//         caption: 'Local food vendors with fresh prepared meals'
//     }
// ];

// Define proper types for ticket selections
interface TicketSelection {
    ticket_type_id: string
    ticket_type: {
        id: string
        name: string
        price: number
    }
    quantity: number
    unit_price: number
    total_price: number
}

interface GuestInfo {
    email: string
    name: string
}

interface EventDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
    const { id } = use(params);
    const { user } = useAuth();

    // Checkout flow state
    const [checkoutStep, setCheckoutStep] = useState<'tickets' | 'checkout' | 'success'>('tickets');
    const [selectedTickets, setSelectedTickets] = useState<TicketSelection[]>([]);
    const [guestInfo, _setGuestInfo] = useState<GuestInfo | undefined>();

    // TODO: Fetch actual event data based on id
    const event = getSampleEventDetails(id);

    // TODO: Check if current user is the organizer of this event
    const isOrganizer = user?.id === event?.organizer?.id || (user?.user_metadata?.role === 'admin');

    const handleCheckoutSuccess = (paymentIntentId: string) => {
        console.log('Payment successful:', paymentIntentId);
        setCheckoutStep('success');
        // TODO: Redirect to success page or show success message
    };

    const handleCheckoutCancel = () => {
        setCheckoutStep('tickets');
        setSelectedTickets([]);
    };

    const handleTicketsChange = (tickets: TicketSelection[]) => {
        setSelectedTickets(tickets);
    };

    const handlePurchaseClick = () => {
        setCheckoutStep('checkout');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const hasPrice = event?.is_paid && event?.ticket_types && event?.ticket_types.length > 0;
    const lowestPrice = hasPrice ? Math.min(...event?.ticket_types!.map(t => t.price)) : 0;

    // Debug logging
    console.log('[DEBUG] Event page rendering:', {
        eventId: event?.id,
        isPaid: event?.is_paid,
        checkoutStep,
        showTickets: event?.is_paid && checkoutStep === 'tickets',
        hasTicketTypes: !!event?.ticket_types,
        ticketTypesLength: event?.ticket_types?.length || 0
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-blue-600">
                            Home
                        </Link>
                        <span>→</span>
                        <Link href="/?category=all" className="hover:text-blue-600">
                            Events
                        </Link>
                        <span>→</span>
                        <span className="text-gray-900">{event?.title}</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                        {/* Event Image Gallery */}
                        {/* <EventImageGallery
                            images={sampleGalleryImages}
                            eventTitle={event.title}
                        /> */}

                        {/* Temporary placeholder for event images */}
                        <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <div className="text-center text-gray-500">
                                <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-3 flex items-center justify-center">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-700 mb-1">{event?.title}</p>
                                <p className="text-sm text-gray-500">Event images coming soon</p>
                            </div>
                        </div>

                        {/* Event Title and Basic Info */}
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{event?.title}</h1>
                                <div className="flex items-center space-x-3 sm:ml-4 self-start">
                                    <button className="p-3 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors touch-target">
                                        <Heart className="w-5 h-5" />
                                        <span className="sr-only">Save event</span>
                                    </button>
                                    <button className="p-3 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-colors touch-target">
                                        <Share2 className="w-5 h-5" />
                                        <span className="sr-only">Share event</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 lg:gap-4 text-sm text-gray-600 mb-6">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">{formatDate(event?.start_time)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">{formatTime(event?.start_time)} - {formatTime(event?.end_time)}</span>
                                </div>
                                <div className="flex items-start space-x-2 sm:col-span-2 lg:col-span-1">
                                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{event?.location}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span className="font-medium">{event?.organizer.display_name}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                                    {event?.category}
                                </span>
                                <span className="flex items-center space-x-1 text-lg font-semibold text-green-600 bg-green-50 px-3 py-2 rounded-full">
                                    <DollarSign className="w-5 h-5" />
                                    <span>{event?.is_paid ? (hasPrice ? `$${lowestPrice}` : 'Paid') : 'Free'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Event Description */}
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                                <div className="prose prose-gray max-w-none text-sm sm:text-base">
                                    <p className="text-gray-700 mb-4 leading-relaxed">{event?.description}</p>
                                    {event?.short_description && (
                                        <div className="text-gray-600 italic">
                                            {event?.short_description}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ticket Management - Only for Organizers */}
                        {isOrganizer && (
                            <TicketTypeManager
                                eventId={event?.id}
                                isOrganizer={isOrganizer}
                            />
                        )}

                        {/* Ticket Selection - For all users */}
                        {event?.is_paid && checkoutStep === 'tickets' && (
                            <TicketSelection
                                eventId={event?.id}
                                selectedTickets={selectedTickets}
                                onTicketsChange={handleTicketsChange}
                                onPurchaseClick={handlePurchaseClick}
                            />
                        )}

                        {/* Checkout Form */}
                        {event?.is_paid && checkoutStep === 'checkout' && (
                            <CheckoutForm
                                eventId={event?.id}
                                selectedTickets={selectedTickets}
                                guestInfo={guestInfo}
                                onSuccess={handleCheckoutSuccess}
                                onCancel={handleCheckoutCancel}
                            />
                        )}

                        {/* Additional Information */}
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <span className="font-medium text-gray-900 min-w-0 sm:min-w-[100px]">Duration:</span>
                                        <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">
                                            {Math.round((new Date(event?.end_time).getTime() - new Date(event?.start_time).getTime()) / (1000 * 60 * 60))} hours
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <span className="font-medium text-gray-900 min-w-0 sm:min-w-[100px]">Category:</span>
                                        <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">{event?.category}</span>
                                    </div>
                                    {event?.capacity && (
                                        <div className="flex flex-col sm:flex-row sm:items-center">
                                            <span className="font-medium text-gray-900 min-w-0 sm:min-w-[100px]">Capacity:</span>
                                            <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">{event?.capacity} people</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row sm:items-start">
                                        <span className="font-medium text-gray-900 min-w-0 sm:min-w-[100px]">Accessibility:</span>
                                        <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">Contact organizer for accessibility information</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6 order-1 lg:order-2">
                        {/* RSVP/Ticket Card - Only show for FREE events */}
                        {!event?.is_paid && (
                            <RSVPTicketSection
                                eventId={event?.id}
                                eventTitle={event?.title}
                                eventDate={formatDate(event?.start_time)}
                                eventTime={`${formatTime(event?.start_time)} - ${formatTime(event?.end_time)}`}
                                eventLocation={event?.location}
                                capacity={event?.capacity}
                                currentRSVPs={event?.rsvp_count}
                                isRegistrationOpen={true}
                            />
                        )}

                        {/* Google Calendar Integration - Temporarily show for all users to test */}
                        <GoogleCalendarConnectWithStatus
                            action="create_event"
                            returnUrl={`/events/${event?.id}`}
                            className="bg-white"
                            eventData={event}
                        />

                        {/* Organizer Info */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{event?.organizer.display_name}</div>
                                        <div className="text-sm text-gray-600">Event Organizer</div>
                                    </div>
                                </div>
                                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                    Contact Organizer
                                </button>
                            </CardContent>
                        </Card>

                        {/* Location/Map */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                                <div className="mb-4">
                                    <div className="flex items-start space-x-2">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div className="text-gray-700">{event?.location}</div>
                                    </div>
                                </div>
                                <EventMap
                                    location={event?.location}
                                    eventTitle={event?.title}
                                    className="mb-4"
                                />
                                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                    Get Directions
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 