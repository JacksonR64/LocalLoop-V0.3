"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, DollarSign, Share2, Heart, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Navigation } from '@/components/ui/Navigation';
import { EventData } from '@/components/events';
import { EventMapWrapper as EventMap } from '@/components/events/EventMapWrapper';
import { RSVPTicketSection } from '@/components/events/RSVPTicketSection';
import TicketSelection from '@/components/events/TicketSelection';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { GoogleCalendarConnectWithStatus } from '@/components/GoogleCalendarConnect';
import { formatPrice } from '@/lib/utils/ticket-utils';
import type { TicketType } from '@/lib/types';

// Interface for selected tickets matching TicketSelection component
interface TicketSelectionItem {
    ticket_type_id: string;
    ticket_type: {
        id: string;
        name: string;
        price: number;
    };
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface EventDetailClientProps {
    event: EventData;
}

export function EventDetailClient({ event }: EventDetailClientProps) {
    const router = useRouter();
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<TicketSelectionItem[]>([]);
    const [checkoutStep, setCheckoutStep] = useState<'tickets' | 'checkout'>('tickets');

    // Fetch ticket types for paid events
    useEffect(() => {
        if (event.is_paid) {
            const fetchTicketTypes = async () => {
                try {
                    // Use database_id for API calls, fallback to id if not available
                    const eventId = event.database_id || event.id;
                    const response = await fetch(`/api/ticket-types?event_id=${eventId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setTicketTypes(data.ticket_types || []);
                    } else {
                        console.error('Failed to fetch ticket types');
                    }
                } catch (error) {
                    console.error('Error fetching ticket types:', error);
                }
            };
            fetchTicketTypes();
        }
    }, [event.id, event.database_id, event.is_paid]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleTicketsChange = (tickets: TicketSelectionItem[]) => {
        setSelectedTickets(tickets);
    };

    const getTotalPrice = () => {
        return selectedTickets.reduce((total, ticket) => total + ticket.total_price, 0);
    };

    const getTotalTickets = () => {
        return selectedTickets.reduce((total, ticket) => total + ticket.quantity, 0);
    };

    const handleProceedToCheckout = () => {
        setCheckoutStep('checkout');
    };

    const handleBackToTickets = () => {
        setCheckoutStep('tickets');
    };

    return (
        <div className="min-h-screen bg-gray-50" data-test-id="event-detail-page">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-test-id="event-detail-main">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8" data-test-id="event-detail-content">
                        {/* Event Header */}
                        <div data-test-id="event-header">
                            {event.image_url && (
                                <div className="mb-6" data-test-id="event-image">
                                    <Image
                                        src={event.image_url}
                                        alt={event.title}
                                        width={800}
                                        height={256}
                                        className="w-full h-64 object-cover rounded-lg"
                                        priority
                                    />
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2" data-test-id="event-title">{event.title}</h1>
                                    <p className="text-lg text-gray-600 mb-4" data-test-id="event-short-description">{event.short_description}</p>
                                </div>
                                <div className="flex gap-2" data-test-id="event-actions">
                                    <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors" data-test-id="share-button">
                                        <Share2 className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors" data-test-id="favorite-button">
                                        <Heart className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" data-test-id="event-details-grid">
                                <div className="flex items-center gap-3" data-test-id="event-date">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">{formatDate(event.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-3" data-test-id="event-time">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">
                                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3" data-test-id="event-location">
                                    <MapPin className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">{event.location || 'Location TBD'}</span>
                                </div>
                                <div className="flex items-center gap-3" data-test-id="event-organizer">
                                    <User className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">{event.organizer.display_name}</span>
                                </div>
                            </div>

                            {event.is_paid && (
                                <div className="flex items-center gap-2 mb-6" data-test-id="paid-event-indicator">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <span className="text-green-600 font-medium">Paid Event</span>
                                </div>
                            )}
                        </div>

                        {/* Event Description */}
                        <Card data-test-id="event-description-card">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4" data-test-id="description-title">About This Event</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 leading-relaxed" data-test-id="event-description">{event.description}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Map */}
                        {event.location && (
                            <Card data-test-id="event-map-card">
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-semibold mb-4" data-test-id="location-title">Location</h2>
                                    <div data-test-id="event-map">
                                        <EventMap location={event.location || 'Location TBD'} eventTitle={event.title} />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Google Calendar Integration */}
                        <Card data-test-id="calendar-integration-card">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4" data-test-id="calendar-title">Add to Calendar</h2>
                                <div data-test-id="google-calendar-integration">
                                    <GoogleCalendarConnectWithStatus
                                        action="create_event"
                                        returnUrl={`/events/${event.id}`}
                                        eventData={{
                                            id: event.id,
                                            title: event.title,
                                            description: event.description,
                                            start_time: event.start_time,
                                            end_time: event.end_time,
                                            location: event.location,
                                            is_paid: event.is_paid,
                                            rsvp_count: event.rsvp_count,
                                            organizer: event.organizer
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1" data-test-id="event-sidebar">
                        <div className="sticky top-24 space-y-6">
                            {/* Registration/Ticket Section */}
                            {event.is_paid && ticketTypes.length > 0 ? (
                                <Card data-test-id="ticket-section">
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-semibold mb-4" data-test-id="ticket-section-title">Get Tickets</h2>

                                        {checkoutStep === 'tickets' ? (
                                            <div className="space-y-4" data-test-id="ticket-selection">
                                                <div data-test-id="ticket-selection-component">
                                                    <TicketSelection
                                                        eventId={event.id}
                                                        selectedTickets={selectedTickets}
                                                        onTicketsChange={handleTicketsChange}
                                                    />
                                                </div>

                                                {getTotalTickets() > 0 && (
                                                    <div className="border-t pt-4" data-test-id="ticket-summary">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="font-medium">Total:</span>
                                                            <span className="text-xl font-bold" data-test-id="total-price">{formatPrice(getTotalPrice())}</span>
                                                        </div>
                                                        <button
                                                            onClick={handleProceedToCheckout}
                                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                                            data-test-id="proceed-to-checkout-button"
                                                        >
                                                            Proceed to Checkout
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4" data-test-id="checkout-section">
                                                <button
                                                    onClick={handleBackToTickets}
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                                                    data-test-id="back-to-tickets-button"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Back to Tickets
                                                </button>

                                                <div data-test-id="checkout-form">
                                                    <CheckoutForm
                                                        eventId={event.id}
                                                        selectedTickets={selectedTickets}
                                                        onSuccess={(paymentIntentId) => {
                                                            console.log('Payment successful:', paymentIntentId)
                                                            // Handle success - could redirect or show success message
                                                            setCheckoutStep('tickets')
                                                        }}
                                                        onCancel={() => {
                                                            setCheckoutStep('tickets')
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card data-test-id="rsvp-section">
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-semibold mb-4" data-test-id="rsvp-section-title">RSVP</h2>
                                        <div data-test-id="rsvp-component">
                                            <RSVPTicketSection
                                                eventId={event.database_id || event.id}
                                                eventTitle={event.title}
                                                eventDate={formatDate(event.start_time)}
                                                eventTime={formatTime(event.start_time)}
                                                eventLocation={event.location || 'Location TBD'}
                                                capacity={event.capacity}
                                                currentRSVPs={event.rsvp_count}
                                                isRegistrationOpen={true}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Event Stats */}
                            <Card data-test-id="event-stats-card">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-4" data-test-id="event-stats-title">Event Details</h3>
                                    <div className="space-y-3" data-test-id="event-stats-list">
                                        <div className="flex justify-between" data-test-id="event-category">
                                            <span className="text-gray-600">Category:</span>
                                            <span className="text-gray-900 capitalize">{event.category}</span>
                                        </div>
                                        {event.capacity && (
                                            <div className="flex justify-between" data-test-id="event-capacity">
                                                <span className="text-gray-600">Capacity:</span>
                                                <span className="text-gray-900">{event.capacity}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between" data-test-id="event-rsvp-count">
                                            <span className="text-gray-600">RSVPs:</span>
                                            <span className="text-gray-900">{event.rsvp_count}</span>
                                        </div>
                                        {event.capacity && (
                                            <div className="flex justify-between" data-test-id="event-available-spots">
                                                <span className="text-gray-600">Available:</span>
                                                <span className="text-gray-900">{event.capacity - event.rsvp_count}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 