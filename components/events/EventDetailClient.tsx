"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, DollarSign, Share2, Heart, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { EventData } from '@/components/events';
import { EventMap } from '@/components/events/EventMap';
import { RSVPTicketSection } from '@/components/events/RSVPTicketSection';
import TicketTypeManager from '@/components/events/TicketTypeManager';
import TicketSelection from '@/components/events/TicketSelection';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { GoogleCalendarConnectWithStatus } from '@/components/GoogleCalendarConnect';
import type { Event, TicketType } from '@/lib/types';
import EventImageGallery from '@/components/events/EventImageGallery';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch ticket types for paid events
    useEffect(() => {
        if (event.is_paid) {
            const fetchTicketTypes = async () => {
                try {
                    const response = await fetch(`/api/ticket-types?event_id=${event.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setTicketTypes(data.ticket_types || []);
                    } else {
                        console.error('Failed to fetch ticket types');
                    }
                } catch (error) {
                    console.error('Error fetching ticket types:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTicketTypes();
        } else {
            setLoading(false);
        }
    }, [event.id, event.is_paid]);

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

    // Convert selectedTickets array to object format for CheckoutForm compatibility
    const getSelectedTicketsForCheckout = () => {
        const ticketsObj: { [key: string]: number } = {};
        selectedTickets.forEach(ticket => {
            ticketsObj[ticket.ticket_type_id] = ticket.quantity;
        });
        return ticketsObj;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        <div className="ml-auto">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-gray-900">LocalLoop</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Header */}
                        <div>
                            {event.image_url && (
                                <div className="mb-6">
                                    <img
                                        src={event.image_url}
                                        alt={event.title}
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                                    <p className="text-lg text-gray-600 mb-4">{event.short_description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                                        <Share2 className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                                        <Heart className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">{formatDate(event.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">
                                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">{event.location}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-900">{event.organizer.display_name}</span>
                                </div>
                            </div>

                            {event.is_paid && (
                                <div className="flex items-center gap-2 mb-6">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <span className="text-green-600 font-medium">Paid Event</span>
                                </div>
                            )}
                        </div>

                        {/* Event Description */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-gray-700 leading-relaxed">{event.description}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Map */}
                        {event.location && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-semibold mb-4">Location</h2>
                                    <EventMap address={event.location} />
                                </CardContent>
                            </Card>
                        )}

                        {/* Google Calendar Integration */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Add to Calendar</h2>
                                <GoogleCalendarConnectWithStatus
                                    action="create_event"
                                    returnUrl={`/events/${event.id}`}
                                    eventData={{
                                        title: event.title,
                                        description: event.description,
                                        start_time: event.start_time,
                                        end_time: event.end_time,
                                        location: event.location
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Registration/Ticket Section */}
                            {event.is_paid && ticketTypes.length > 0 ? (
                                <Card>
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-semibold mb-4">Get Tickets</h2>

                                        {checkoutStep === 'tickets' ? (
                                            <div className="space-y-4">
                                                <TicketSelection
                                                    eventId={event.id}
                                                    selectedTickets={selectedTickets}
                                                    onTicketsChange={handleTicketsChange}
                                                    onPurchaseClick={handleProceedToCheckout}
                                                />

                                                {getTotalTickets() > 0 && (
                                                    <div className="border-t pt-4">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="font-medium">Total:</span>
                                                            <span className="text-xl font-bold">${getTotalPrice().toFixed(2)}</span>
                                                        </div>
                                                        <button
                                                            onClick={handleProceedToCheckout}
                                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            Proceed to Checkout
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <button
                                                    onClick={handleBackToTickets}
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Back to Tickets
                                                </button>

                                                <CheckoutForm
                                                    eventId={event.id}
                                                    selectedTickets={getSelectedTicketsForCheckout()}
                                                    ticketTypes={ticketTypes}
                                                    totalPrice={getTotalPrice()}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-semibold mb-4">RSVP</h2>
                                        <RSVPTicketSection
                                            eventId={event.id}
                                            eventTitle={event.title}
                                            eventDate={formatDate(event.start_time)}
                                            eventTime={formatTime(event.start_time)}
                                            eventLocation={event.location}
                                            capacity={event.capacity}
                                            currentRSVPs={event.rsvp_count}
                                            isRegistrationOpen={true}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Event Stats */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Category:</span>
                                            <span className="text-gray-900 capitalize">{event.category}</span>
                                        </div>
                                        {event.capacity && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Capacity:</span>
                                                <span className="text-gray-900">{event.capacity}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">RSVPs:</span>
                                            <span className="text-gray-900">{event.rsvp_count}</span>
                                        </div>
                                        {event.capacity && (
                                            <div className="flex justify-between">
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