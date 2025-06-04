'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatPrice } from '@/lib/utils/ticket-utils'
import {
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Calculator,
    Calendar,
    CreditCard,
    Info,
    Minus,
    AlertCircle
} from 'lucide-react'

interface OrderData {
    id: string
    total_amount: number
    net_amount: number
    refund_amount: number
    currency: string
    status: string
    refunded_at?: string
    is_refundable: boolean
    events: {
        title: string
        start_time: string
        cancelled: boolean
    }
    tickets: Array<{
        id: string
        quantity: number
        ticket_types: {
            name: string
        }
    }>
}

interface RefundDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    order: OrderData
    onRefundSuccess: () => void
}

export default function RefundDialog({
    open,
    onOpenChange,
    order,
    onRefundSuccess
}: RefundDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'review' | 'confirm' | 'processing'>('review')

    // Calculate refund details
    const stripeFixedFee = 30 // $0.30 in cents
    const stripePercentageFee = 2.9 / 100 // 2.9%
    const totalStripeFee = stripeFixedFee + (order.total_amount * stripePercentageFee)
    const estimatedRefund = Math.max(0, order.total_amount - order.refund_amount - stripeFixedFee)

    const isEventCancelled = order.events.cancelled
    const isFullRefundEligible = isEventCancelled || order.is_refundable

    const handleRefundRequest = async () => {
        try {
            setLoading(true)
            setError(null)
            setStep('processing')

            const response = await fetch('/api/refunds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: order.id,
                    refund_type: isEventCancelled ? 'full_cancellation' : 'customer_request',
                    reason: isEventCancelled
                        ? 'Event cancelled by organizer'
                        : 'Customer requested refund within policy window'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to process refund')
            }

            const result = await response.json()

            // Show success and close dialog
            onRefundSuccess()
            onOpenChange(false)

        } catch (err) {
            console.error('Refund error:', err)
            setError(err instanceof Error ? err.message : 'Failed to process refund')
            setStep('review')
        } finally {
            setLoading(false)
        }
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

    const resetDialog = () => {
        setStep('review')
        setError(null)
        setLoading(false)
    }

    if (step === 'processing') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <LoadingSpinner size="lg" />
                        <h3 className="text-lg font-medium mt-4 mb-2">Processing Refund</h3>
                        <p className="text-gray-600 text-center">
                            Please wait while we process your refund request...
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) resetDialog()
            onOpenChange(open)
        }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        Request Refund
                    </DialogTitle>
                    <DialogDescription>
                        Review refund details for your order
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Event Details
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium">{order.events.title}</span>
                                {isEventCancelled && (
                                    <Badge variant="destructive">Cancelled</Badge>
                                )}
                            </div>
                            <div className="text-sm text-gray-600">
                                {formatDateTime(order.events.start_time)}
                            </div>
                            <div className="text-sm text-gray-600">
                                Order #{order.id.slice(-8)} • {order.tickets.length} ticket{order.tickets.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {/* Refund Calculation */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Refund Calculation
                        </h4>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span>Original payment</span>
                                <span className="font-medium">{formatPrice(order.total_amount)}</span>
                            </div>

                            {order.refund_amount > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Previously refunded</span>
                                    <span className="font-medium">
                                        <Minus className="w-3 h-3 inline mr-1" />
                                        {formatPrice(order.refund_amount)}
                                    </span>
                                </div>
                            )}

                            {!isEventCancelled && (
                                <div className="flex justify-between text-red-600">
                                    <span className="flex items-center gap-1">
                                        Processing fee (non-refundable)
                                        <Info className="w-3 h-3" />
                                    </span>
                                    <span className="font-medium">
                                        <Minus className="w-3 h-3 inline mr-1" />
                                        {formatPrice(stripeFixedFee)}
                                    </span>
                                </div>
                            )}

                            <hr />

                            <div className="flex justify-between text-lg font-semibold">
                                <span>Refund amount</span>
                                <span className="text-green-600">
                                    {formatPrice(isEventCancelled ? order.total_amount - order.refund_amount : estimatedRefund)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Refund Policy */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
                            <Info className="w-4 h-4" />
                            {isEventCancelled ? 'Event Cancellation Policy' : 'Refund Policy'}
                        </h4>
                        <div className="text-sm text-blue-700 space-y-2">
                            {isEventCancelled ? (
                                <>
                                    <p>This event has been cancelled by the organizer. You are eligible for a full refund including all fees.</p>
                                    <p><strong>Processing time:</strong> Refunds typically appear in your account within 5-10 business days.</p>
                                </>
                            ) : (
                                <>
                                    <p>Refunds are available up to 24 hours before the event start time. The Stripe processing fee ($0.30) is non-refundable for customer-requested refunds.</p>
                                    <p><strong>Processing time:</strong> Refunds typically appear in your account within 5-10 business days.</p>
                                    <p><strong>Note:</strong> This refund will be processed to your original payment method.</p>
                                </>
                            )}
                        </div>
                    </div>

                    {step === 'confirm' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Confirm your refund request:</strong> This action cannot be undone.
                                Are you sure you want to proceed with this refund?
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    {step === 'review' ? (
                        <Button
                            onClick={() => setStep('confirm')}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Continue to Confirm
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep('review')}
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleRefundRequest}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm Refund
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 