'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, User, DollarSign, Share2, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { EventData, EventImageGallery, type EventImage } from '@/components/events';
import { EventMap } from '@/components/events/EventMap';
import { RSVPTicketSection } from '@/components/events/RSVPTicketSection';
import TicketTypeManager from '@/components/events/TicketTypeManager';
import TicketSelection from '@/components/events/TicketSelection';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';
import { useAuth } from '@/lib/auth-context';

// Sample event data matching the actual EventData interface
const getSampleEventDetails = (eventId: string): EventData => {
    // Map all homepage event IDs (1-13) to their correct details
    switch (eventId) {
        case '1':
            return {
                id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479', // Valid UUID
                title: 'Community Garden Cleanup',
                description: 'Join us for a morning of community service cleaning up the local garden. We\'ll be removing weeds, planting new flowers, and maintaining the compost area. All tools and refreshments will be provided. This is a great opportunity to meet your neighbors and contribute to our local environment.',
                short_description: 'Free community garden cleanup volunteer event',
                start_time: '2024-02-15T09:00:00.000Z',
                end_time: '2024-02-15T12:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Community Garden on Elm Street',
                is_paid: false,
                capacity: 30,
                current_rsvps: 12,
                organizer: 'Green Neighborhood Initiative',
                category: 'Community Service',
                accessibility_info: 'Outdoor event, uneven terrain, gloves provided'
            };

        case '2':
            return {
                id: 'b58bd20c-69dd-5483-b678-1f13c3d4e590', // Valid UUID
                title: 'Local Business Networking',
                description: 'Monthly networking event for local business owners and entrepreneurs. Join us for an evening of connections, collaboration, and community building. Featuring guest speakers from successful local businesses and interactive breakout sessions.',
                short_description: 'Professional networking for local business owners',
                start_time: '2024-02-22T18:00:00.000Z',
                end_time: '2024-02-22T21:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Downtown Conference Center',
                is_paid: true,
                capacity: 100,
                current_rsvps: 45,
                organizer: 'Local Business Alliance',
                category: 'Professional',
                accessibility_info: 'Wheelchair accessible, sign language interpreter available upon request'
            };

        case '3':
            return {
                id: 'c69de41e-8bff-4605-a89a-3f35e5f6d702', // Valid UUID (fixed 'g' and 'd' characters)
                title: 'Kids Art Workshop',
                description: 'Creative art workshop designed specifically for children ages 6-12. Professional art instructors will guide kids through painting techniques, craft projects, and creative expression. All materials included. Parents welcome to stay and watch.',
                short_description: 'Fun art workshop for kids with painting and crafts',
                start_time: '2024-05-20T15:00:00.000Z',
                end_time: '2024-05-20T17:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Community Center',
                is_paid: true,
                capacity: 20,
                current_rsvps: 8,
                organizer: 'Arts Alliance',
                category: 'Arts',
                accessibility_info: 'Wheelchair accessible, service animals welcome'
            };

        case '4':
            return {
                id: 'd7afe31f-9c00-5716-b9bb-4046f6e7e813', // Valid UUID
                title: 'Tech Meetup: AI & Startups',
                description: 'Monthly tech meetup focusing on artificial intelligence applications in startup environments. Features presentations from local tech entrepreneurs, networking opportunities, and hands-on demos of cutting-edge AI tools.',
                short_description: 'Free tech meetup exploring AI and startup innovation',
                start_time: '2024-03-08T19:00:00.000Z',
                end_time: '2024-03-08T22:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Tech Hub Co-working Space',
                is_paid: false,
                capacity: 80,
                current_rsvps: 23,
                organizer: 'Local Tech Community',
                category: 'Technology',
                accessibility_info: 'Fully accessible venue, live streaming available'
            };

        case '5':
            return {
                id: 'e8bdf42d-ad11-6827-cacc-5157a7f8f924', // Valid UUID (fixed invalid character)
                title: 'Yoga in the Park',
                description: 'Outdoor yoga session suitable for all skill levels. Bring your own mat and water bottle. Led by certified yoga instructor with 10+ years of experience. Rain cancellation policy applies.',
                short_description: 'Free outdoor yoga for all levels',
                start_time: '2024-03-15T08:00:00.000Z',
                end_time: '2024-03-15T09:30:00.000Z',
                timezone: 'America/New_York',
                location: 'Central Park Pavilion',
                is_paid: false,
                capacity: 40,
                current_rsvps: 18,
                organizer: 'Wellness Community Group',
                category: 'Health & Wellness',
                accessibility_info: 'Outdoor event on grass, modifications available for all abilities'
            };

        case '6':
            return {
                id: 'f9cef53e-be22-7938-dbdd-6268a8b9ca35', // Valid UUID (fixed invalid characters)
                title: 'Board Game Night',
                description: 'Weekly board game gathering featuring classic and modern games. All games provided, from strategy games to party games. Food and drinks available for purchase. Perfect for meeting new people and having fun.',
                short_description: 'Weekly social board game gathering',
                start_time: '2024-02-28T18:30:00.000Z',
                end_time: '2024-02-28T22:00:00.000Z',
                timezone: 'America/New_York',
                location: 'The Game Cafe',
                is_paid: false,
                capacity: 50,
                current_rsvps: 22,
                organizer: 'Board Game Society',
                category: 'Entertainment',
                accessibility_info: 'Wheelchair accessible, large print games available'
            };

        case '7':
            return {
                id: 'a0ddf64f-cf33-8a49-eccf-7379c9aab046', // Valid UUID (fixed invalid characters)
                title: 'Startup Pitch Night',
                description: 'Local entrepreneurs present their startup ideas to a panel of investors and community members. Networking session follows presentations. Great opportunity for aspiring entrepreneurs and potential investors.',
                short_description: 'Entrepreneurs pitch startup ideas to investors',
                start_time: '2024-04-10T18:00:00.000Z',
                end_time: '2024-04-10T21:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Innovation Hub',
                is_paid: true,
                capacity: 120,
                current_rsvps: 67,
                organizer: 'Startup Community',
                category: 'Business',
                accessibility_info: 'Full accessibility, presentation materials available digitally'
            };

        case '8':
            return {
                id: 'b1eef750-d044-9b5a-fddf-848aa0abc157', // Valid UUID (fixed invalid characters)
                title: 'Outdoor Movie Night',
                description: 'Family-friendly outdoor movie screening under the stars. Bring blankets and chairs. Concessions available for purchase. This month featuring a classic adventure film suitable for all ages.',
                short_description: 'Free family movie night under the stars',
                start_time: '2024-06-14T20:00:00.000Z',
                end_time: '2024-06-14T23:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Riverside Park Amphitheater',
                is_paid: false,
                capacity: 200,
                current_rsvps: 89,
                organizer: 'Parks & Recreation Department',
                category: 'Entertainment',
                accessibility_info: 'Accessible seating area available, audio description available'
            };

        case '9':
            return {
                id: 'c2fff861-e155-ac6b-0eda-959ba1bcd268', // Valid UUID (fixed invalid characters)
                title: 'Food Truck Festival',
                description: 'Annual food truck festival featuring 15+ local food vendors, live music, and family activities. Sample diverse cuisines and support local food businesses. Live entertainment throughout the day.',
                short_description: 'Annual food truck festival with local vendors',
                start_time: '2024-05-25T11:00:00.000Z',
                end_time: '2024-05-25T18:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Downtown Square',
    is_paid: true,
    capacity: 500,
                current_rsvps: 234,
                organizer: 'Downtown Business Association',
                category: 'Food & Drink',
                accessibility_info: 'Wheelchair accessible, sensory-friendly hours 11am-1pm'
            };

        case '10':
            return {
                id: 'd300f972-f266-bd7c-1feb-a6ac2a2de379', // Valid UUID (fixed invalid characters)
                title: 'Photography Walk',
                description: 'Guided photography walk through historic downtown area. Learn composition techniques and discover hidden photogenic spots. All skill levels welcome. Bring your camera or smartphone.',
                short_description: 'Free guided photography walk downtown',
                start_time: '2024-04-20T09:00:00.000Z',
                end_time: '2024-04-20T12:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Historic Downtown District',
                is_paid: false,
                capacity: 25,
                current_rsvps: 15,
                organizer: 'Photography Club',
                category: 'Arts',
                accessibility_info: 'Walking event, shorter route options available'
            };

        case '11':
            return {
                id: 'e411fa83-0377-ce8d-20fc-b7bd3a3ef48a', // Valid UUID (fixed invalid characters)
                title: 'Coding Bootcamp Demo Day',
                description: 'Local coding bootcamp students present their final projects. Witness the next generation of developers showcase web applications, mobile apps, and innovative solutions to real-world problems.',
                short_description: 'Free coding bootcamp student project presentations',
                start_time: '2024-03-30T14:00:00.000Z',
                end_time: '2024-03-30T17:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Tech Learning Center',
                is_paid: false,
                capacity: 100,
                current_rsvps: 42,
                organizer: 'Code Academy',
                category: 'Technology',
                accessibility_info: 'Fully accessible, projects demonstrated with screen readers'
            };

        case '12':
            return {
                id: 'f522fb94-1488-df9e-31fd-c8ce4a4f559b', // Valid UUID (fixed invalid characters)
                title: 'Charity Fun Run',
                description: '5K fun run and 1-mile family walk to raise funds for local food bank. Registration includes race t-shirt and post-race refreshments. Prizes for various categories and age groups.',
                short_description: 'Charity 5K run and family walk fundraiser',
                start_time: '2024-04-07T08:00:00.000Z',
                end_time: '2024-04-07T11:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Lakeside Trail',
                is_paid: true,
                capacity: 300,
                current_rsvps: 178,
                organizer: 'Community Athletics Club',
                category: 'Sports',
                accessibility_info: 'Accessible 1-mile route, wheelchair racing category available'
            };

        case '13':
            return {
                id: 'a633fca5-2599-e0af-42fe-d9df5a5f66ac', // Valid UUID (fixed invalid characters)
                title: 'Makers Market',
                description: 'Monthly artisan market featuring local crafters, artists, and makers. Discover handmade goods, unique gifts, and creative works from talented community members. Support local artisans.',
                short_description: 'Free monthly market for local artisans and makers',
                start_time: '2024-03-16T10:00:00.000Z',
                end_time: '2024-03-16T16:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Community Center Courtyard',
                is_paid: false,
                capacity: 150,
                current_rsvps: 67,
                organizer: 'Local Artisans Guild',
                category: 'Arts',
                accessibility_info: 'Outdoor/indoor hybrid event, wheelchair accessible'
            };

        default:
            // Default fallback
            return {
                id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
                title: 'Community Garden Cleanup',
                description: 'Default event description',
                short_description: 'Default event',
                start_time: '2024-02-15T09:00:00.000Z',
                end_time: '2024-02-15T12:00:00.000Z',
                timezone: 'America/New_York',
                location: 'Community Garden',
                is_paid: false,
                capacity: 30,
                current_rsvps: 12,
                organizer: 'Community Group',
                category: 'Community',
                accessibility_info: 'Contact organizer for accessibility information'
            };
    }
};

// Sample gallery images for the event
const sampleGalleryImages: EventImage[] = [
    {
        url: '/events/farmers-market.jpg',
        alt: 'Community farmers market with vendors and families',
        caption: 'Main farmers market area with local vendors',
        isMain: true
    },
    {
        url: '/events/farmers-market-2.jpg',
        alt: 'Local produce stands at farmers market',
        caption: 'Fresh local produce from area farms'
    },
    {
        url: '/events/farmers-market-3.jpg',
        alt: 'Art and craft vendors at community fair',
        caption: 'Local artisans showcasing handmade crafts'
    },
    {
        url: '/events/farmers-market-4.jpg',
        alt: 'Live music performance at farmers market',
        caption: 'Live music entertainment for all ages'
    },
    {
        url: '/events/farmers-market-5.jpg',
        alt: 'Families enjoying community event',
        caption: 'Family-friendly activities and atmosphere'
    },
    {
        url: '/events/farmers-market-6.jpg',
        alt: 'Food vendors at farmers market',
        caption: 'Local food vendors with fresh prepared meals'
    }
];

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
    const [guestInfo, setGuestInfo] = useState<GuestInfo | undefined>();

    // TODO: Fetch actual event data based on id
    const event = getSampleEventDetails(id);

    // TODO: Check if current user is the organizer of this event
    const isOrganizer = user?.id === event.organizer?.id || (user?.user_metadata?.role === 'admin');

    const handlePurchaseInitiated = (selections: TicketSelection[], guestData?: GuestInfo) => {
        setSelectedTickets(selections);
        setGuestInfo(guestData);
        setCheckoutStep('checkout');
    };

    const handleCheckoutSuccess = (paymentIntentId: string) => {
        console.log('Payment successful:', paymentIntentId);
        setCheckoutStep('success');
        // TODO: Redirect to success page or show success message
    };

    const handleCheckoutCancel = () => {
        setCheckoutStep('tickets');
        setSelectedTickets([]);
        setGuestInfo(undefined);
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

    const hasPrice = event.is_paid && event.ticket_types && event.ticket_types.length > 0;
    const lowestPrice = hasPrice ? Math.min(...event.ticket_types!.map(t => t.price)) : 0;

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
                        <span className="text-gray-900">{event.title}</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                        {/* Event Image Gallery */}
                        <EventImageGallery
                            images={sampleGalleryImages}
                            eventTitle={event.title}
                        />

                        {/* Event Title and Basic Info */}
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{event.title}</h1>
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
                                    <span className="font-medium">{formatDate(event.start_time)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                                </div>
                                <div className="flex items-start space-x-2 sm:col-span-2 lg:col-span-1">
                                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{event.location}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span className="font-medium">{event.organizer.display_name}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                                    {event.category}
                                </span>
                                <span className="flex items-center space-x-1 text-lg font-semibold text-green-600 bg-green-50 px-3 py-2 rounded-full">
                                    <DollarSign className="w-5 h-5" />
                                    <span>{event.is_paid ? (hasPrice ? `$${lowestPrice}` : 'Paid') : 'Free'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Event Description */}
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                                <div className="prose prose-gray max-w-none text-sm sm:text-base">
                                    <p className="text-gray-700 mb-4 leading-relaxed">{event.description}</p>
                                    {event.short_description && (
                                        <div className="text-gray-600 italic">
                                            {event.short_description}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ticket Management - Only for Organizers */}
                        {isOrganizer && (
                            <TicketTypeManager
                                eventId={event.id}
                                isOrganizer={isOrganizer}
                            />
                        )}

                        {/* Ticket Selection - For all users */}
                        {event.is_paid && checkoutStep === 'tickets' && (
                            <TicketSelection
                                eventId={event.id}
                                onPurchaseInitiated={handlePurchaseInitiated}
                                showGuestForm={true}
                            />
                        )}

                        {/* Checkout Form */}
                        {event.is_paid && checkoutStep === 'checkout' && (
                            <CheckoutForm
                                eventId={event.id}
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
                                            {Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60 * 60))} hours
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <span className="font-medium text-gray-900 min-w-0 sm:min-w-[100px]">Category:</span>
                                        <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">{event.category}</span>
                                    </div>
                                    {event.capacity && (
                                        <div className="flex flex-col sm:flex-row sm:items-center">
                                            <span className="font-medium text-gray-900 min-w-0 sm:min-w-[100px]">Capacity:</span>
                                            <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">{event.capacity} people</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row sm:items-start">
                                        <span className="font-medium text-gray-900 min-w-0 sm:min-w-[100px]">Accessibility:</span>
                                        <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">{event.accessibility_info}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6 order-1 lg:order-2">
                        {/* RSVP/Ticket Card - Only show for FREE events */}
                        {!event.is_paid && (
                        <RSVPTicketSection
                            eventId={event.id}
                            eventTitle={event.title}
                            eventDate={formatDate(event.start_time)}
                            eventTime={`${formatTime(event.start_time)} - ${formatTime(event.end_time)}`}
                            eventLocation={event.location}
                            capacity={event.capacity}
                                currentRSVPs={event.current_rsvps}
                                isRegistrationOpen={true}
                        />
                        )}

                        {/* Google Calendar Integration */}
                        <GoogleCalendarConnect
                            action="create_event"
                            returnUrl={`/events/${id}`}
                            className="bg-white"
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
                                        <div className="font-medium text-gray-900">{event.organizer.display_name}</div>
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
                                        <div className="text-gray-700">{event.location}</div>
                                    </div>
                                </div>
                                <EventMap
                                    location={event.location}
                                    eventTitle={event.title}
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