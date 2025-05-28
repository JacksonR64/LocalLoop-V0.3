// LocalLoop Database Types
// TypeScript interfaces matching the PostgreSQL schema
// Google Calendar API Integration Support (PRIMARY CLIENT REQUIREMENT)

export type UserRole = 'user' | 'organizer' | 'admin';
export type EventCategory = 'workshop' | 'meeting' | 'social' | 'arts' | 'sports' | 'family' | 'business' | 'education' | 'other';
export type EventStatus = 'upcoming' | 'in_progress' | 'past' | 'cancelled';
export type RSVPStatus = 'confirmed' | 'cancelled' | 'waitlist';
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'failed' | 'cancelled';
export type CalendarIntegrationStatus = 'added' | 'failed' | 'pending' | 'not_attempted';

// User interface with Google Calendar OAuth integration
export interface User {
    id: string;
    created_at: string;
    updated_at: string;

    // Core user information
    email: string;
    display_name?: string;
    avatar_url?: string;
    role: UserRole;

    // Account status
    email_verified: boolean;
    last_login?: string;
    deleted_at?: string;

    // Preferences
    email_preferences: {
        marketing: boolean;
        events: boolean;
        reminders: boolean;
    };

    // Google Calendar API Integration (CLIENT REQUIREMENT)
    google_calendar_access_token?: string; // Encrypted in database
    google_calendar_refresh_token?: string; // Encrypted in database
    google_calendar_token_expires_at?: string;
    google_calendar_connected: boolean;
    google_calendar_error?: string;

    // Computed columns
    display_name_or_email: string; // Display name with email fallback
    has_valid_google_calendar: boolean; // Valid Google Calendar access

    // Metadata
    metadata: Record<string, any>;
}

// Event interface with Google Calendar template support
export interface Event {
    id: string;
    created_at: string;
    updated_at: string;

    // Core event information
    title: string;
    slug: string;
    description: string;
    short_description?: string;

    // Date and time
    start_time: string;
    end_time: string;
    timezone: string;

    // Location information
    location?: string;
    location_details?: string;
    latitude?: number;
    longitude?: number;
    is_online: boolean;
    online_url?: string;

    // Event categorization
    category: EventCategory;
    tags: string[];

    // Capacity and ticketing
    capacity?: number;
    is_paid: boolean;

    // Organization
    organizer_id: string;

    // Media and presentation
    image_url?: string;
    image_alt_text?: string;
    featured: boolean;

    // Status and publishing
    published: boolean;
    cancelled: boolean;
    status: EventStatus; // Computed column

    // Analytics
    view_count: number;

    // Google Calendar Integration (CLIENT REQUIREMENT)
    google_calendar_event_template: GoogleCalendarEventTemplate;

    // Computed columns
    rsvp_count: number; // Count of confirmed RSVPs
    spots_remaining?: number; // Remaining capacity (NULL if unlimited)
    is_full: boolean; // Boolean flag for capacity reached
    is_open_for_registration: boolean; // Boolean flag for accepting registrations
    total_revenue: number; // Total revenue from completed orders

    // Metadata
    metadata: Record<string, any>;
}

// Google Calendar event template for consistent event creation
export interface GoogleCalendarEventTemplate {
    summary_template?: string; // How to format the event title
    description_template?: string; // How to format the description
    location_format?: string; // How to format location
    attendees_include_organizer?: boolean;
    reminders?: {
        useDefault: boolean;
        overrides?: Array<{
            method: 'email' | 'popup';
            minutes: number;
        }>;
    };
    visibility?: 'default' | 'public' | 'private';
    custom_properties?: Record<string, any>;
}

// RSVP interface with Google Calendar integration tracking
export interface RSVP {
    id: string;
    created_at: string;
    updated_at: string;

    // Event and user relationship
    event_id: string;
    user_id?: string;

    // Guest information (for non-registered users)
    guest_email?: string;
    guest_name?: string;

    // RSVP status
    status: RSVPStatus;

    // Event management
    check_in_time?: string;
    notes?: string;

    // Google Calendar Integration Tracking (CLIENT REQUIREMENT)
    google_calendar_event_id?: string; // For event deletion if RSVP cancelled
    added_to_google_calendar: boolean;
    calendar_add_attempted_at?: string;
    calendar_add_error?: string;

    // Computed columns
    calendar_integration_status: CalendarIntegrationStatus; // Google Calendar status
    is_cancellable: boolean; // Boolean flag based on cancellation policy

    // Metadata
    metadata: Record<string, any>;
}

// Ticket type interface
export interface TicketType {
    id: string;
    created_at: string;
    updated_at: string;

    // Event relationship
    event_id: string;

    // Ticket information
    name: string;
    description?: string;
    price: number; // in cents
    capacity?: number;
    sort_order: number;

    // Sale timing
    sale_start?: string;
    sale_end?: string;

    // Computed columns
    tickets_sold: number; // Count of tickets sold from completed orders
    tickets_remaining?: number; // Remaining ticket capacity (NULL if unlimited)
    is_available: boolean; // Boolean flag for if tickets can be purchased
    total_revenue: number; // Total revenue generated by this ticket type

    // Metadata
    metadata: Record<string, any>;
}

// Order interface with Google Calendar integration tracking
export interface Order {
    id: string;
    created_at: string;
    updated_at: string;

    // Customer information
    user_id?: string;
    guest_email?: string;
    guest_name?: string;

    // Event relationship
    event_id: string;

    // Order status and payment
    status: OrderStatus;
    total_amount: number; // in cents
    currency: string;

    // Stripe integration
    stripe_payment_intent_id?: string;
    stripe_session_id?: string;

    // Refund information
    refunded_at?: string;
    refund_amount: number;

    // Google Calendar Integration Tracking (CLIENT REQUIREMENT)
    google_calendar_event_id?: string; // For event deletion if order cancelled
    added_to_google_calendar: boolean;
    calendar_add_attempted_at?: string;
    calendar_add_error?: string;

    // Computed columns
    tickets_count: number; // Total number of tickets in order
    is_refundable: boolean; // Boolean flag based on refund policy
    net_amount: number; // Order amount after refunds
    calendar_integration_status: CalendarIntegrationStatus; // Google Calendar status

    // Metadata
    metadata: Record<string, any>;
}

// Ticket interface
export interface Ticket {
    id: string;
    created_at: string;

    // Order and ticket type relationship
    order_id: string;
    ticket_type_id: string;

    // Ticket details
    quantity: number;
    unit_price: number; // in cents

    // Attendee information
    attendee_name?: string;
    attendee_email?: string;

    // Ticket identification
    confirmation_code: string;
    qr_code_data?: string;

    // Event management
    check_in_time?: string;

    // Computed columns
    total_price: number; // Total price (quantity * unit_price)
    is_used: boolean; // Boolean flag if ticket has been checked in
    is_valid: boolean; // Boolean flag for ticket validity

    // Metadata
    metadata: Record<string, any>;
}

// Extended interfaces with relationships for API responses

export interface EventWithDetails extends Event {
    organizer: Pick<User, 'id' | 'display_name' | 'email' | 'display_name_or_email'>;
    ticket_types: TicketType[];
}

export interface RSVPWithDetails extends RSVP {
    event: Pick<Event, 'id' | 'title' | 'start_time' | 'location'>;
    user?: Pick<User, 'id' | 'display_name' | 'email' | 'display_name_or_email'>;
}

export interface OrderWithDetails extends Order {
    event: Pick<Event, 'id' | 'title' | 'start_time' | 'location'>;
    tickets: Array<Ticket & { ticket_type: TicketType }>;
    user?: Pick<User, 'id' | 'display_name' | 'email' | 'display_name_or_email'>;
}

// Google Calendar integration specific types
export interface GoogleCalendarOAuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at: Date;
    scope: string;
    token_type: string;
}

export interface GoogleCalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    location?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    }>;
    reminders?: {
        useDefault: boolean;
        overrides?: Array<{
            method: 'email' | 'popup';
            minutes: number;
        }>;
    };
    visibility?: 'default' | 'public' | 'private';
    status?: 'tentative' | 'confirmed' | 'cancelled';
}

export interface CalendarIntegrationResult {
    success: boolean;
    google_calendar_event_id?: string;
    error?: string;
    error_type?: 'auth_error' | 'api_error' | 'rate_limit' | 'permission_denied';
    fallback_action?: 'ics_download' | 'manual_add' | 'retry_later';
}

// Database utility types (exclude computed columns from create operations)
export type CreateUserData = Omit<User, 'id' | 'created_at' | 'updated_at' | 'display_name_or_email' | 'has_valid_google_calendar'>;
export type UpdateUserData = Partial<CreateUserData>;

export type CreateEventData = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'status' | 'rsvp_count' | 'spots_remaining' | 'is_full' | 'is_open_for_registration' | 'total_revenue'>;
export type UpdateEventData = Partial<CreateEventData>;

export type CreateRSVPData = Omit<RSVP, 'id' | 'created_at' | 'updated_at' | 'calendar_integration_status' | 'is_cancellable'>;
export type UpdateRSVPData = Partial<CreateRSVPData>;

export type CreateOrderData = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'tickets_count' | 'is_refundable' | 'net_amount' | 'calendar_integration_status'>;
export type UpdateOrderData = Partial<CreateOrderData>;

export type CreateTicketTypeData = Omit<TicketType, 'id' | 'created_at' | 'updated_at' | 'tickets_sold' | 'tickets_remaining' | 'is_available' | 'total_revenue'>;
export type UpdateTicketTypeData = Partial<CreateTicketTypeData>;

export type CreateTicketData = Omit<Ticket, 'id' | 'created_at' | 'total_price' | 'is_used' | 'is_valid'>;

// API request/response types
export interface EventListParams {
    page?: number;
    limit?: number;
    category?: EventCategory;
    location?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    is_paid?: boolean;
    featured?: boolean;
    is_open?: boolean; // Filter by is_open_for_registration
}

export interface EventListResponse {
    events: EventWithDetails[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
    filters: {
        categories: Array<{ name: EventCategory; count: number }>;
        locations: Array<{ name: string; count: number }>;
    };
}

// Dashboard and analytics types leveraging computed columns
export interface EventAnalytics {
    event: Pick<Event, 'id' | 'title' | 'status' | 'start_time' | 'capacity'>;
    metrics: {
        rsvp_count: number;
        spots_remaining?: number;
        is_full: boolean;
        total_revenue: number;
        calendar_integration_rate: number; // Percentage of successful calendar additions
    };
}

export interface UserDashboard {
    user: Pick<User, 'id' | 'display_name_or_email' | 'has_valid_google_calendar'>;
    upcoming_events: Array<{
        event: Pick<Event, 'id' | 'title' | 'start_time' | 'location'>;
        rsvp?: Pick<RSVP, 'status' | 'calendar_integration_status'>;
        order?: Pick<Order, 'status' | 'tickets_count' | 'calendar_integration_status'>;
    }>;
    past_events_count: number;
}

export interface OrganizerDashboard {
    organizer: Pick<User, 'id' | 'display_name_or_email'>;
    events: Array<{
        event: Pick<Event, 'id' | 'title' | 'status' | 'start_time' | 'rsvp_count' | 'total_revenue' | 'is_open_for_registration'>;
        ticket_types: Array<Pick<TicketType, 'id' | 'name' | 'tickets_sold' | 'tickets_remaining' | 'total_revenue'>>;
    }>;
    total_revenue: number;
    total_attendees: number;
}

// Error types for Google Calendar integration
export interface CalendarIntegrationError extends Error {
    type: 'auth_error' | 'api_error' | 'rate_limit' | 'permission_denied';
    should_retry: boolean;
    fallback_action: 'ics_download' | 'manual_add' | 'skip';
    google_error_code?: string;
} 