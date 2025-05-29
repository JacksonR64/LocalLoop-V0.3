'use client';

import React, { useState } from 'react';
import {
    CreditCard,
    Check,
    Plus,
    Minus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface TicketType {
    id: string;
    name: string;
    price: number;
    description?: string;
    available_quantity?: number;
    max_per_person?: number;
}

interface RSVPTicketSectionProps {
    eventId: string;
    eventTitle: string;
    isPaid: boolean;
    capacity?: number;
    currentRSVPCount: number;
    ticketTypes?: TicketType[];
    onRSVP?: (data: RSVPData) => void;
    onTicketPurchase?: (data: TicketPurchaseData) => void;
}

interface RSVPData {
    firstName: string;
    lastName: string;
    email: string;
    guestCount: number;
    specialRequests?: string;
}

interface TicketPurchaseData {
    ticketSelections: { [ticketId: string]: number };
    buyerInfo: RSVPData;
    paymentMethod: string;
}

type FormStep = 'selection' | 'details' | 'payment' | 'confirmation';

export function RSVPTicketSection({
    eventTitle,
    isPaid,
    ticketTypes = [],
    onRSVP,
    onTicketPurchase
}: RSVPTicketSectionProps) {
    const [currentStep, setCurrentStep] = useState<FormStep>('selection');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketSelections, setTicketSelections] = useState<{ [key: string]: number }>({});
    const [rsvpData, setRSVPData] = useState<RSVPData>({
        firstName: '',
        lastName: '',
        email: '',
        guestCount: 1,
        specialRequests: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const calculateTotal = () => {
        return Object.entries(ticketSelections).reduce((total, [ticketId, quantity]) => {
            const ticket = ticketTypes.find(t => t.id === ticketId);
            return total + (ticket ? ticket.price * quantity : 0);
        }, 0);
    };

    const getTotalTickets = () => {
        return Object.values(ticketSelections).reduce((sum, quantity) => sum + quantity, 0);
    };

    const updateTicketQuantity = (ticketId: string, change: number) => {
        setTicketSelections(prev => {
            const current = prev[ticketId] || 0;
            const newQuantity = Math.max(0, current + change);
            const ticket = ticketTypes.find(t => t.id === ticketId);
            const maxAllowed = ticket?.max_per_person || 10;

            return {
                ...prev,
                [ticketId]: Math.min(newQuantity, maxAllowed)
            };
        });
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!rsvpData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!rsvpData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (!rsvpData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(rsvpData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (isPaid && getTotalTickets() === 0) {
            newErrors.tickets = 'Please select at least one ticket';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (isPaid) {
                onTicketPurchase?.({
                    ticketSelections,
                    buyerInfo: rsvpData,
                    paymentMethod: 'stripe' // placeholder
                });
            } else {
                onRSVP?.(rsvpData);
            }

            setCurrentStep('confirmation');
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTicketSelection = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Tickets</h3>
            {ticketTypes.map(ticket => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-medium text-gray-900">{ticket.name}</h4>
                            {ticket.description && (
                                <p className="text-sm text-gray-600">{ticket.description}</p>
                            )}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                            ${ticket.price}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {ticket.available_quantity && (
                                <span>{ticket.available_quantity} available</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => updateTicketQuantity(ticket.id, -1)}
                                disabled={!ticketSelections[ticket.id]}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                                {ticketSelections[ticket.id] || 0}
                            </span>
                            <button
                                onClick={() => updateTicketQuantity(ticket.id, 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {errors.tickets && (
                <p className="text-red-600 text-sm">{errors.tickets}</p>
            )}

            {getTotalTickets() > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Total: {getTotalTickets()} ticket(s)</span>
                        <span className="text-xl font-bold">${calculateTotal()}</span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderRSVPForm = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">RSVP Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                    </label>
                    <input
                        type="text"
                        value={rsvpData.firstName}
                        onChange={(e) => setRSVPData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                        <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                    </label>
                    <input
                        type="text"
                        value={rsvpData.lastName}
                        onChange={(e) => setRSVPData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                        <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                </label>
                <input
                    type="email"
                    value={rsvpData.email}
                    onChange={(e) => setRSVPData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                />
                {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
            </div>

            {!isPaid && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Guests (including yourself)
                    </label>
                    <select
                        value={rsvpData.guestCount}
                        onChange={(e) => setRSVPData(prev => ({ ...prev, guestCount: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests or Dietary Restrictions (Optional)
                </label>
                <textarea
                    value={rsvpData.specialRequests}
                    onChange={(e) => setRSVPData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requests, dietary restrictions, or accessibility needs?"
                    rows={3}
                />
            </div>
        </div>
    );

    const renderPaymentSection = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                    <CreditCard className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="text-sm text-yellow-800 font-medium">Payment Integration Placeholder</p>
                        <p className="text-sm text-yellow-700">
                            In production, this would integrate with Stripe, PayPal, or similar payment processor.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                {Object.entries(ticketSelections).map(([ticketId, quantity]) => {
                    const ticket = ticketTypes.find(t => t.id === ticketId);
                    if (!ticket || quantity === 0) return null;

                    return (
                        <div key={ticketId} className="flex justify-between items-center py-2">
                            <span className="text-gray-700">
                                {ticket.name} × {quantity}
                            </span>
                            <span className="font-medium">${(ticket.price * quantity).toFixed(2)}</span>
                        </div>
                    );
                })}
                <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center font-semibold text-lg">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConfirmation = () => (
        <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
                {isPaid ? 'Payment Successful!' : 'RSVP Confirmed!'}
            </h3>
            <p className="text-gray-600">
                {isPaid
                    ? 'Your tickets have been purchased successfully. You should receive a confirmation email shortly.'
                    : 'Your RSVP has been confirmed. You should receive a confirmation email shortly.'
                }
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                <p className="text-sm text-gray-700">{eventTitle}</p>
                <p className="text-sm text-gray-600">
                    {isPaid ? `${getTotalTickets()} ticket(s) purchased` : `RSVP for ${rsvpData.guestCount} guest(s)`}
                </p>
            </div>
        </div>
    );

    const getStepContent = () => {
        switch (currentStep) {
            case 'selection':
                return isPaid ? renderTicketSelection() : renderRSVPForm();
            case 'details':
                return renderRSVPForm();
            case 'payment':
                return renderPaymentSection();
            case 'confirmation':
                return renderConfirmation();
            default:
                return null;
        }
    };

    const getNextStepLabel = () => {
        if (currentStep === 'confirmation') return null;
        if (currentStep === 'selection' && !isPaid) return 'Confirm RSVP';
        if (currentStep === 'selection' && isPaid) return 'Continue';
        if (currentStep === 'details') return isPaid ? 'Proceed to Payment' : 'Confirm RSVP';
        if (currentStep === 'payment') return 'Complete Purchase';
        return 'Continue';
    };

    const handleNext = () => {
        if (currentStep === 'selection' && !isPaid) {
            handleSubmit();
        } else if (currentStep === 'selection' && isPaid) {
            if (getTotalTickets() === 0) {
                setErrors({ tickets: 'Please select at least one ticket' });
                return;
            }
            setCurrentStep('details');
        } else if (currentStep === 'details' && isPaid) {
            if (validateForm()) {
                setCurrentStep('payment');
            }
        } else if (currentStep === 'details' && !isPaid) {
            handleSubmit();
        } else if (currentStep === 'payment') {
            handleSubmit();
        }
    };

    if (currentStep === 'confirmation') {
        return (
            <Card>
                <CardContent className="p-6">
                    {renderConfirmation()}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Progress Indicators for Paid Events */}
                    {isPaid && (
                        <div className="flex items-center space-x-2 mb-6">
                            {['selection', 'details', 'payment'].map((step, index) => (
                                <React.Fragment key={step}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step
                                        ? 'bg-blue-600 text-white'
                                        : index < ['selection', 'details', 'payment'].indexOf(currentStep)
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {index < ['selection', 'details', 'payment'].indexOf(currentStep) ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    {index < 2 && (
                                        <div className={`flex-1 h-1 ${index < ['selection', 'details', 'payment'].indexOf(currentStep)
                                            ? 'bg-green-600'
                                            : 'bg-gray-200'
                                            }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {getStepContent()}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        {currentStep !== 'selection' && (
                            <button
                                onClick={() => {
                                    if (currentStep === 'details') setCurrentStep('selection');
                                    if (currentStep === 'payment') setCurrentStep('details');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                        )}

                        {getNextStepLabel() && (
                            <button
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${isPaid && currentStep === 'payment'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : !isPaid
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Processing...' : getNextStepLabel()}
                            </button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 