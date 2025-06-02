'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
    formatPrice,
    calculateCustomerTotal,
    checkTicketAvailability,
    formatAvailabilityStatus,
    sortTicketTypes,
    getActiveTicketTypes
} from '@/lib/utils/ticket-utils'
import type { TicketType, TicketAvailability } from '@/lib/types/ticket'
import { useAuth } from '@/lib/auth-context'
import { Plus, Minus, CreditCard, Users, Clock, AlertCircle } from 'lucide-react'

interface TicketSelectionProps {
    eventId: string
    onPurchaseInitiated?: (selections: TicketSelection[], guestInfo?: GuestInfo) => void
    showGuestForm?: boolean
}

interface TicketSelection {
    ticket_type_id: string
    ticket_type: TicketType
    quantity: number
    unit_price: number // in cents
    total_price: number // in cents
}

interface GuestInfo {
    email: string
    name: string
}

export default function TicketSelection({
    eventId,
    onPurchaseInitiated,
    showGuestForm = true
}: TicketSelectionProps) {
    const { user } = useAuth()
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
    const [availability, setAvailability] = useState<Record<string, TicketAvailability>>({})
    const [selections, setSelections] = useState<Record<string, number>>({})
    const [guestInfo, setGuestInfo] = useState<GuestInfo>({ email: '', name: '' })
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showGuestFields, setShowGuestFields] = useState(false)

    // Load ticket types and availability
    useEffect(() => {
        const loadTicketTypes = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(`/api/ticket-types?event_id=${eventId}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to load ticket types')
                }

                const activeTickets = getActiveTicketTypes(data.ticket_types)
                const sortedTickets = sortTicketTypes(activeTickets)
                setTicketTypes(sortedTickets)

                // Load availability for each ticket type
                const availabilityData: Record<string, TicketAvailability> = {}
                for (const ticketType of sortedTickets) {
                    // TODO: Fetch actual sold count from tickets table
                    const soldCount = 0 // Placeholder
                    availabilityData[ticketType.id] = checkTicketAvailability(ticketType, soldCount)
                }
                setAvailability(availabilityData)

            } catch (err) {
                console.error('Error loading ticket types:', err)
                setError(err instanceof Error ? err.message : 'Failed to load tickets')
            } finally {
                setLoading(false)
            }
        }

        if (eventId) {
            loadTicketTypes()
        }
    }, [eventId])

    // Update guest form visibility when user status changes
    useEffect(() => {
        if (!user && showGuestForm && Object.values(selections).some(qty => qty > 0)) {
            setShowGuestFields(true)
        } else {
            setShowGuestFields(false)
        }
    }, [user, selections, showGuestForm])

    const updateQuantity = (ticketTypeId: string, change: number) => {
        setSelections(prev => {
            const currentQty = prev[ticketTypeId] || 0
            const newQty = Math.max(0, currentQty + change)

            // Check availability constraints
            const ticketAvailability = availability[ticketTypeId]
            if (ticketAvailability?.available_count !== null && newQty > ticketAvailability.available_count) {
                return prev // Don't allow exceeding available count
            }

            return {
                ...prev,
                [ticketTypeId]: newQty
            }
        })
    }

    const setQuantity = (ticketTypeId: string, quantity: number) => {
        const ticketAvailability = availability[ticketTypeId]
        const maxQty = ticketAvailability?.available_count || 999
        const validQty = Math.max(0, Math.min(quantity, maxQty))

        setSelections(prev => ({
            ...prev,
            [ticketTypeId]: validQty
        }))
    }

    const getSelectedTickets = (): TicketSelection[] => {
        return Object.entries(selections)
            .filter(([, quantity]) => quantity > 0)
            .map(([ticketTypeId, quantity]) => {
                const ticketType = ticketTypes.find(t => t.id === ticketTypeId)!
                const unitPrice = ticketType.price
                const totalPrice = unitPrice * quantity

                return {
                    ticket_type_id: ticketTypeId,
                    ticket_type: ticketType,
                    quantity,
                    unit_price: unitPrice,
                    total_price: totalPrice
                }
            })
    }

    const calculateSubtotal = (): number => {
        return getSelectedTickets().reduce((total, selection) => total + selection.total_price, 0)
    }

    const calculateTotal = (): number => {
        const subtotal = calculateSubtotal()
        return calculateCustomerTotal(subtotal)
    }

    const getTotalTicketCount = (): number => {
        return Object.values(selections).reduce((total, qty) => total + qty, 0)
    }

    const validateGuestInfo = (): boolean => {
        if (!showGuestFields) return true

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(guestInfo.email) && guestInfo.name.trim().length > 0
    }

    const handlePurchase = async () => {
        try {
            setPurchasing(true)
            setError(null)

            const selectedTickets = getSelectedTickets()
            if (selectedTickets.length === 0) {
                setError('Please select at least one ticket')
                return
            }

            if (!user && showGuestForm && !validateGuestInfo()) {
                setError('Please provide valid email and name')
                return
            }

            // Pass selections to parent component
            onPurchaseInitiated?.(selectedTickets, guestInfo)

        } catch (err) {
            console.error('Error initiating purchase:', err)
            setError(err instanceof Error ? err.message : 'Failed to initiate purchase')
        } finally {
            setPurchasing(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                </CardContent>
            </Card>
        )
    }

    if (error && ticketTypes.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (ticketTypes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">No tickets are currently available for this event.</p>
                </CardContent>
            </Card>
        )
    }

    const subtotal = calculateSubtotal()
    const total = calculateTotal()
    const totalTickets = getTotalTicketCount()

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Select Tickets
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {ticketTypes.map((ticketType) => {
                        const ticketAvailability = availability[ticketType.id]
                        const quantity = selections[ticketType.id] || 0
                        const isAvailable = ticketAvailability?.is_available || false

                        return (
                            <div
                                key={ticketType.id}
                                className={`border rounded-lg p-4 ${isAvailable ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg">{ticketType.name}</h4>
                                        {ticketType.description && (
                                            <p className="text-gray-600 text-sm mt-1">{ticketType.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="font-bold text-lg">
                                                {formatPrice(ticketType.price)}
                                            </span>
                                            {ticketAvailability && (
                                                <Badge variant={isAvailable ? 'default' : 'secondary'}>
                                                    {formatAvailabilityStatus(ticketAvailability)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {isAvailable && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateQuantity(ticketType.id, -1)}
                                                disabled={quantity === 0}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>

                                            <Input
                                                type="number"
                                                min="0"
                                                max={ticketAvailability?.available_count || 999}
                                                value={quantity}
                                                onChange={(e) => setQuantity(ticketType.id, parseInt(e.target.value) || 0)}
                                                className="w-16 text-center"
                                            />

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateQuantity(ticketType.id, 1)}
                                                disabled={
                                                    ticketAvailability?.available_count !== null &&
                                                    quantity >= (ticketAvailability.available_count || 0)
                                                }
                                                className="h-8 w-8 p-0"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Sale period information */}
                                {(ticketType.sale_start || ticketType.sale_end) && (
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                                        <Clock className="h-4 w-4" />
                                        {ticketType.sale_start && (
                                            <span>Sales start: {new Date(ticketType.sale_start).toLocaleDateString()}</span>
                                        )}
                                        {ticketType.sale_start && ticketType.sale_end && <span> | </span>}
                                        {ticketType.sale_end && (
                                            <span>Sales end: {new Date(ticketType.sale_end).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {error && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Guest Information Form */}
            {showGuestFields && (
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="guest-email" className="block text-sm font-medium mb-1">
                                Email Address
                            </label>
                            <Input
                                id="guest-email"
                                type="email"
                                value={guestInfo.email}
                                onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="guest-name" className="block text-sm font-medium mb-1">
                                Full Name
                            </label>
                            <Input
                                id="guest-name"
                                type="text"
                                value={guestInfo.name}
                                onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Your full name"
                                required
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Order Summary */}
            {totalTickets > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Order Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {getSelectedTickets().map((selection) => (
                            <div key={selection.ticket_type_id} className="flex justify-between">
                                <span>
                                    {selection.quantity}x {selection.ticket_type.name}
                                </span>
                                <span className="font-medium">
                                    {formatPrice(selection.total_price)}
                                </span>
                            </div>
                        ))}

                        <div className="border-t pt-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal ({totalTickets} ticket{totalTickets !== 1 ? 's' : ''})</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>

                            {total > subtotal && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Processing fees</span>
                                    <span>{formatPrice(total - subtotal)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-bold mt-2">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>

                        <Button
                            onClick={handlePurchase}
                            disabled={purchasing || totalTickets === 0}
                            className="w-full"
                            size="lg"
                        >
                            {purchasing ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    {subtotal === 0 ? 'Get Free Tickets' : `Pay ${formatPrice(total)}`}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 