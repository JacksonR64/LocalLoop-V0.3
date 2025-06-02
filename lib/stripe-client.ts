import { loadStripe, Stripe } from '@stripe/stripe-js';

// Client-side Stripe promise (singleton pattern)
let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
    if (!stripePromise) {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
            console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
            return Promise.resolve(null);
        }

        stripePromise = loadStripe(publishableKey);
    }

    return stripePromise;
};

// Stripe Elements appearance configuration
export const stripeElementsAppearance = {
    theme: 'stripe' as const,
    variables: {
        colorPrimary: '#3b82f6', // Blue-500
        colorBackground: '#ffffff',
        colorText: '#1f2937', // Gray-800
        colorDanger: '#ef4444', // Red-500
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
    },
    rules: {
        '.Input': {
            borderColor: '#d1d5db', // Gray-300
            borderRadius: '8px',
            padding: '12px',
            fontSize: '16px',
        },
        '.Input:focus': {
            borderColor: '#3b82f6', // Blue-500
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        },
        '.Label': {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151', // Gray-700
            marginBottom: '8px',
        },
    },
};

// Payment Element options
export const paymentElementOptions = {
    layout: 'tabs' as const,
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
    fields: {
        billingDetails: {
            name: 'auto',
            email: 'auto',
            phone: 'auto',
            address: {
                country: 'auto',
                line1: 'auto',
                line2: 'auto',
                city: 'auto',
                state: 'auto',
                postalCode: 'auto',
            },
        },
    },
};

// Address Element options for billing/shipping
export const addressElementOptions = {
    mode: 'billing' as const,
    allowedCountries: ['US', 'CA', 'MX'],
    fields: {
        phone: 'always' as const,
    },
    validation: {
        phone: {
            required: 'always' as const,
        },
    },
};

// Utility function to check if Stripe is loaded
export const isStripeLoaded = async (): Promise<boolean> => {
    const stripe = await getStripe();
    return stripe !== null;
};

// Error handling for Stripe
export interface StripeError {
    type: string;
    code?: string;
    message: string;
    decline_code?: string;
    payment_intent?: {
        id: string;
        status: string;
    };
}

export function handleStripeError(error: StripeError): string {
    switch (error.type) {
        case 'card_error':
            // A declined card error
            return error.message || 'Your card was declined.';
        case 'validation_error':
            // Invalid parameters were supplied to Stripe's API
            return error.message || 'Invalid payment information.';
        case 'api_error':
            // An error occurred internally with Stripe's API
            return 'A payment processing error occurred. Please try again.';
        case 'authentication_error':
            // Authentication with Stripe's API failed
            return 'Authentication failed. Please contact support.';
        case 'rate_limit_error':
            // Too many requests made to the API too quickly
            return 'Too many requests. Please wait a moment and try again.';
        default:
            return error.message || 'An unexpected error occurred.';
    }
}

// Payment status helpers
export const PAYMENT_STATUS = {
    REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
    REQUIRES_CONFIRMATION: 'requires_confirmation',
    REQUIRES_ACTION: 'requires_action',
    PROCESSING: 'processing',
    SUCCEEDED: 'succeeded',
    CANCELED: 'canceled',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export function getPaymentStatusMessage(status: PaymentStatus): string {
    switch (status) {
        case PAYMENT_STATUS.REQUIRES_PAYMENT_METHOD:
            return 'Please provide payment information.';
        case PAYMENT_STATUS.REQUIRES_CONFIRMATION:
            return 'Confirming your payment...';
        case PAYMENT_STATUS.REQUIRES_ACTION:
            return 'Additional authentication required.';
        case PAYMENT_STATUS.PROCESSING:
            return 'Processing your payment...';
        case PAYMENT_STATUS.SUCCEEDED:
            return 'Payment successful!';
        case PAYMENT_STATUS.CANCELED:
            return 'Payment was canceled.';
        default:
            return 'Unknown payment status.';
    }
} 