import Stripe from 'stripe';

// Lazy initialization for Stripe client
let stripeInstance: Stripe | null = null;

// Get Stripe instance with lazy initialization
export const getStripe = (): Stripe => {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }

        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-05-28.basil',
            typescript: true,
        });
    }

    return stripeInstance;
};

// Backwards compatibility - export stripe as a getter property  
export const stripe = {
    get instance() {
        return getStripe();
    },
    // Proxy common Stripe methods
    get customers() {
        return getStripe().customers;
    },
    get paymentIntents() {
        return getStripe().paymentIntents;
    },
    get refunds() {
        return getStripe().refunds;
    },
    get webhooks() {
        return getStripe().webhooks;
    },
    get checkout() {
        return getStripe().checkout;
    }
};

// Stripe configuration validation
export function validateStripeConfig(): boolean {
    const requiredVars = [
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        console.warn('Missing Stripe environment variables:', missing);
        return false;
    }

    return true;
}

// Get publishable key for client-side
export function getStripePublishableKey(): string {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
        throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
    }
    return key;
}

// Stripe webhook signature verification
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): Stripe.Event {
    try {
        console.log('[DEBUG] Webhook signature verification:', {
            payload_length: payload.length,
            signature_present: !!signature,
            signature_prefix: signature?.substring(0, 20) + '...',
            secret_present: !!secret
        });

        // Check if signature header is present and properly formatted
        if (!signature) {
            throw new Error('No signature header provided');
        }

        // Check if signature contains the expected format (t=timestamp,v1=hash)
        if (!signature.includes('t=') || !signature.includes('v1=')) {
            console.log('[DEBUG] Malformed signature header:', signature);
            throw new Error(`Malformed signature header: ${signature.substring(0, 50)}...`);
        }

        return getStripe().webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
        console.error('[ERROR] Webhook signature verification failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            signature_header: signature?.substring(0, 100) + '...',
            payload_length: payload.length
        });
        throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Common Stripe configurations
export const STRIPE_CONFIG = {
    CURRENCY: 'usd',
    AUTOMATIC_TAX: {
        enabled: false, // Enable in production if needed
    },
    PAYMENT_METHOD_TYPES: ['card'] as const,
    MODE: 'payment' as const,
} as const;

// Price formatting utilities
export function formatPrice(amount: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe uses cents
}

export function convertToStripeAmount(amount: number): number {
    return Math.round(amount * 100); // Convert dollars to cents
}

// Stripe Customer utilities
export async function createStripeCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
    return await getStripe().customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata || {},
    });
}

export async function getOrCreateCustomer(
    email: string,
    name?: string
): Promise<Stripe.Customer> {
    // Try to find existing customer by email
    const existingCustomers = await getStripe().customers.list({
        email,
        limit: 1,
    });

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
    }

    // Create new customer if not found
    return await createStripeCustomer({ email, name });
} 