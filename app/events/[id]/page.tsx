'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, User, DollarSign, Share2, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { EventData, EventImageGallery, type EventImage } from '@/components/events';
import { EventMap } from '@/components/events/EventMap';
import { RSVPTicketSection } from '@/components/events/RSVPTicketSection';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';

// Sample event data matching the actual EventData interface
const sampleEventDetails: EventData = {
    id: '1',
    title: 'Community Farmers Market & Art Fair',
    description: 'Join us for our monthly community farmers market featuring local produce, artisan crafts, live music, and family-friendly activities. This is a wonderful opportunity to support local businesses, meet your neighbors, and enjoy the vibrant community atmosphere.',
    short_description: 'Monthly farmers market with local produce, crafts, and live music',
    start_time: '2024-02-15T09:00:00',
    end_time: '2024-02-15T15:00:00',
    location: 'Downtown Community Square, 123 Main Street',
    category: 'Community',
    is_paid: true,
    featured: true,
    capacity: 500,
    rsvp_count: 245,
    is_open_for_registration: true,
    image_url: '/events/farmers-market.jpg',
    image_alt_text: 'Community farmers market with vendors and families',
    organizer: {
        display_name: 'Downtown Community Association'
    },
    ticket_types: [
        { name: 'General Admission', price: 25 },
        { name: 'VIP Access', price: 50 }
    ]
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

interface EventDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
    const { id } = use(params);

    // TODO: Fetch actual event data based on id
    const event = sampleEventDetails;

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
                                        <span className="text-gray-700 mt-1 sm:mt-0 sm:ml-2">Wheelchair accessible, service animals welcome</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6 order-1 lg:order-2">
                        {/* RSVP/Ticket Card */}
                        <RSVPTicketSection
                            eventId={event.id}
                            eventTitle={event.title}
                            eventDate={formatDate(event.start_time)}
                            eventTime={`${formatTime(event.start_time)} - ${formatTime(event.end_time)}`}
                            eventLocation={event.location}
                            capacity={event.capacity}
                            currentRSVPs={event.rsvp_count}
                            isRegistrationOpen={event.is_open_for_registration ?? true}
                        />

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