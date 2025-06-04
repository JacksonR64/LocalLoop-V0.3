'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatPrice } from '@/lib/utils/ticket-utils'
import RefundDialog from './RefundDialog'
import {
    CalendarDays,
    MapPin,
    CreditCard,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    ExternalLink,
    Receipt,
    Download,
    User,
    Ticket
} from 'lucide-react'

interface OrderData {
    id: string
    created_at: string
    updated_at: string
    event_id: string
    status: string
    total_amount: number
    currency: string
    refunded_at?: string
    refund_amount: number
    is_refundable: boolean
    net_amount: number
    tickets_count: number
    calendar_integration_status: string
    stripe_payment_intent_id?: string
    guest_email?: string
    guest_name?: string
    events: {
        id: string
        title: string
        description?: string
        start_time: string
        end_time: string
        location?: string
        slug: string
        cancelled: boolean
    }
    tickets: Array<{
        id: string
        quantity: number
        unit_price: number
        total_price: number
        attendee_name?: string
        attendee_email?: string
        confirmation_code: string
        check_in_time?: string
        is_valid: boolean
        ticket_types: {
            id: string
            name: string
            description?: string
        }
    }>
}

interface UserDashboardProps {
    userEmail?: string
    userName?: string
}

export default function UserDashboard({ userEmail, userName }: UserDashboardProps) {
    const [orders, setOrders] = useState<OrderData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [refundDialogOpen, setRefundDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)

    const fetchOrders = async () => {
        try {
            setRefreshing(true)
            const response = await fetch('/api/orders')

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please sign in to view your orders')
                }
                throw new Error('Failed to fetch orders')
            }

            const data = await response.json()
            setOrders(data.orders || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching orders:', err)
            setError(err instanceof Error ? err.message : 'Failed to load orders')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const getOrderStatusBadge = (order: OrderData) => {
        if (order.refunded_at && order.refund_amount > 0) {
            const isFullRefund = order.refund_amount >= order.total_amount
            return (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    {isFullRefund ? 'Refunded' : 'Partially Refunded'}
                </Badge>
            )
        }

        switch (order.status) {
            case 'completed':
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                )
            case 'failed':
                return (
                    <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </Badge>
                )
            case 'cancelled':
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelled
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline">
                        {order.status}
                    </Badge>
                )
        }
    }

    const getRefundEligibilityInfo = (order: OrderData) => {
        if (order.events.cancelled) {
            return {
                eligible: true,
                reason: 'Event cancelled - full refund available',
                className: 'text-blue-600'
            }
        }

        if (order.status !== 'completed') {
            return {
                eligible: false,
                reason: 'Order not completed',
                className: 'text-gray-500'
            }
        }

        if (order.refunded_at && order.refund_amount >= order.total_amount) {
            return {
                eligible: false,
                reason: 'Already fully refunded',
                className: 'text-gray-500'
            }
        }

        if (order.is_refundable) {
            return {
                eligible: true,
                reason: 'Eligible for refund (24h policy)',
                className: 'text-green-600'
            }
        }

        return {
            eligible: false,
            reason: 'Refund window expired (24h before event)',
            className: 'text-red-600'
        }
    }

    const handleRefundClick = (order: OrderData) => {
        setSelectedOrder(order)
        setRefundDialogOpen(true)
    }

    const handleRefundSuccess = () => {
        // Refresh orders to show updated refund status
        fetchOrders()
        setSelectedOrder(null)
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                    <span className="ml-3 text-gray-600">Loading your events...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                    onClick={fetchOrders}
                    variant="outline"
                    className="mt-4"
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
                        <p className="text-lg text-gray-600 mt-2">
                            Manage your tickets, orders, and event attendance
                        </p>
                    </div>
                    <Button
                        onClick={fetchOrders}
                        variant="outline"
                        disabled={refreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Orders */}
            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-600 mb-6">
                            When you purchase tickets for events, they'll appear here.
                        </p>
                        <Link href="/events">
                            <Button>
                                Browse Events
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => {
                        const refundInfo = getRefundEligibilityInfo(order)

                        return (
                            <Card key={order.id} className="overflow-hidden">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <CardTitle className="text-xl">
                                                    <Link
                                                        href={`/events/${order.events.slug}`}
                                                        className="hover:text-blue-600 transition-colors"
                                                    >
                                                        {order.events.title}
                                                    </Link>
                                                </CardTitle>
                                                {getOrderStatusBadge(order)}
                                                {order.events.cancelled && (
                                                    <Badge variant="destructive">
                                                        Event Cancelled
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="w-4 h-4" />
                                                    {formatDateTime(order.events.start_time)}
                                                </span>
                                                {order.events.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {order.events.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-lg font-semibold">
                                                {formatPrice(order.net_amount)}
                                            </div>
                                            {order.refund_amount > 0 && (
                                                <div className="text-sm text-orange-600">
                                                    -{formatPrice(order.refund_amount)} refunded
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                Order #{order.id.slice(-8)}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    {/* Tickets */}
                                    <div className="space-y-3 mb-4">
                                        {order.tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {ticket.quantity}x {ticket.ticket_types.name}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Confirmation: {ticket.confirmation_code}
                                                        {ticket.check_in_time && (
                                                            <span className="ml-2 text-green-600">
                                                                ✓ Checked in
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        {formatPrice(ticket.total_price)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatPrice(ticket.unit_price)} each
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Details & Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>Ordered {formatDate(order.created_at)}</span>
                                            <span>{order.tickets_count} ticket{order.tickets_count !== 1 ? 's' : ''}</span>

                                            {/* Refund Eligibility */}
                                            <span className={`flex items-center gap-1 ${refundInfo.className}`}>
                                                {refundInfo.eligible ? (
                                                    <CheckCircle className="w-3 h-3" />
                                                ) : (
                                                    <XCircle className="w-3 h-3" />
                                                )}
                                                {refundInfo.reason}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Download Receipt */}
                                            <Button variant="outline" size="sm">
                                                <Download className="w-4 h-4 mr-1" />
                                                Receipt
                                            </Button>

                                            {/* Refund Button */}
                                            {refundInfo.eligible && order.status === 'completed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => handleRefundClick(order)}
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-1" />
                                                    Request Refund
                                                </Button>
                                            )}

                                            {/* View Event */}
                                            <Link href={`/events/${order.events.slug}`}>
                                                <Button variant="outline" size="sm">
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    View Event
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Refund Dialog */}
            {selectedOrder && (
                <RefundDialog
                    open={refundDialogOpen}
                    onOpenChange={setRefundDialogOpen}
                    order={selectedOrder}
                    onRefundSuccess={handleRefundSuccess}
                />
            )}
        </div>
    )
} 