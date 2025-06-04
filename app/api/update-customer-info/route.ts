import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'

const updateCustomerSchema = z.object({
    payment_intent_id: z.string(),
    customer_email: z.string().email(),
    customer_name: z.string().min(1),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        
        // Validate request body
        const validationResult = updateCustomerSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validationResult.error.errors },
                { status: 400 }
            )
        }

        const { payment_intent_id, customer_email, customer_name } = validationResult.data

        // Get the PaymentIntent to access the customer
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
        
        if (!paymentIntent) {
            return NextResponse.json(
                { error: 'PaymentIntent not found' },
                { status: 404 }
            )
        }

        // Update the customer information if there's a customer attached
        if (paymentIntent.customer && typeof paymentIntent.customer === 'string') {
            await stripe.customers.update(paymentIntent.customer, {
                email: customer_email,
                name: customer_name,
            })
        }

        // Update the PaymentIntent metadata with the new customer information
        await stripe.paymentIntents.update(payment_intent_id, {
            metadata: {
                ...paymentIntent.metadata,
                customer_email,
                customer_name,
            },
            receipt_email: customer_email,
        })

        return NextResponse.json({ 
            success: true,
            message: 'Customer information updated successfully'
        })

    } catch (error) {
        console.error('Update customer info error:', error)
        return NextResponse.json(
            { error: 'Failed to update customer information' },
            { status: 500 }
        )
    }
} 