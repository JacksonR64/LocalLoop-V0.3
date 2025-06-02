// Core ticket type interface matching database schema
export interface TicketType {
    id: string;
    event_id: string;
    name: string;
    description: string | null;
    price: number; // in cents
    capacity: number | null;
    sort_order: number;
    sale_start: string | null; // ISO datetime
    sale_end: string | null; // ISO datetime
    created_at: string;
    updated_at: string;
}

// Extended ticket type with event information
export interface TicketTypeWithEvent extends TicketType {
    events?: {
        id: string;
        title: string;
        organizer_id: string;
    };
}

// Ticket type creation payload
export interface CreateTicketTypePayload {
    event_id: string;
    name: string;
    description?: string;
    price: number; // in cents
    capacity?: number;
    sort_order?: number;
    sale_start?: string; // ISO datetime
    sale_end?: string; // ISO datetime
}

// Ticket type update payload
export interface UpdateTicketTypePayload {
    name?: string;
    description?: string;
    price?: number; // in cents
    capacity?: number;
    sort_order?: number;
    sale_start?: string; // ISO datetime
    sale_end?: string; // ISO datetime
}

// Individual ticket interface
export interface Ticket {
    id: string;
    ticket_type_id: string;
    event_id: string;
    user_id: string | null;
    guest_email: string | null;
    guest_name: string | null;
    purchase_price: number; // in cents (price at time of purchase)
    stripe_payment_intent_id: string | null;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
}

// Ticket statuses
export type TicketStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';

// Extended ticket with related data
export interface TicketWithDetails extends Ticket {
    ticket_types?: TicketType;
    events?: {
        id: string;
        title: string;
        date: string;
        time: string;
        location: string;
    };
    users?: {
        id: string;
        email: string;
        full_name: string;
    } | null;
}

// Payment-related interfaces
export interface PaymentIntent {
    id: string;
    amount: number; // in cents
    currency: string;
    status: PaymentIntentStatus;
    client_secret: string;
    metadata: Record<string, string>;
}

export type PaymentIntentStatus =
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';

// Ticket purchase payload
export interface TicketPurchasePayload {
    ticket_type_id: string;
    quantity: number;
    user_id?: string;
    guest_email?: string;
    guest_name?: string;
    payment_method_id?: string;
}

// Ticket purchase response
export interface TicketPurchaseResponse {
    success: boolean;
    payment_intent?: PaymentIntent;
    tickets?: Ticket[];
    client_secret?: string;
    error?: string;
}

// Pricing helpers
export interface PriceCalculation {
    subtotal: number; // in cents
    stripe_fee: number; // in cents
    application_fee: number; // in cents
    total: number; // in cents
    currency: string;
}

// Ticket availability information
export interface TicketAvailability {
    ticket_type_id: string;
    total_capacity: number | null; // null = unlimited
    sold_count: number;
    available_count: number | null; // null = unlimited
    is_available: boolean;
    sale_status: 'not_started' | 'active' | 'ended';
    sale_start: string | null;
    sale_end: string | null;
}

// Event with ticket types
export interface EventWithTicketTypes {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    address: string;
    is_paid: boolean;
    ticket_types: TicketType[];
}

// API response types
export interface TicketTypesResponse {
    ticket_types: TicketType[];
}

export interface TicketTypeResponse {
    ticket_type: TicketTypeWithEvent;
}

export interface CreateTicketTypeResponse {
    message: string;
    ticket_type: TicketType;
}

export interface UpdateTicketTypeResponse {
    message: string;
    ticket_type: TicketType;
}

export interface DeleteTicketTypeResponse {
    message: string;
}

// Form validation types
export interface TicketTypeFormData {
    name: string;
    description: string;
    price: string; // string for form input, converted to number
    capacity: string; // string for form input, converted to number
    sale_start: string;
    sale_end: string;
}

export interface TicketTypeFormErrors {
    name?: string;
    description?: string;
    price?: string;
    capacity?: string;
    sale_start?: string;
    sale_end?: string;
    general?: string;
}

// Utility functions type exports
export type FormatPriceFunction = (amountInCents: number, currency?: string) => string;
export type ConvertToStripeAmountFunction = (dollarAmount: number) => number;
export type CalculateStripeFeeFunction = (amount: number) => PriceCalculation; 