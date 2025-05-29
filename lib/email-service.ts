import { Resend } from 'resend';
import { render } from '@react-email/render';
import RSVPConfirmationEmail from './emails/rsvp-confirmation';
import RSVPCancellationEmail from './emails/rsvp-cancellation';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendRSVPConfirmationProps {
    to: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventAddress: string;
    organizerName: string;
    organizerEmail: string;
    rsvpId: string;
    guestCount: number;
    isAuthenticated: boolean;
    eventSlug?: string;
    cancellationDeadline?: string;
}

export interface SendRSVPCancellationProps {
    to: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventAddress: string;
    organizerName: string;
    organizerEmail: string;
    rsvpId: string;
    cancellationReason?: string;
    eventSlug?: string;
}

export interface EmailServiceResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send RSVP confirmation email to user
 */
export async function sendRSVPConfirmationEmail(
    props: SendRSVPConfirmationProps
): Promise<EmailServiceResponse> {
    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(RSVPConfirmationEmail(props));

        // Send the email
        const response = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'LocalLoop <noreply@localloop.app>',
            to: props.to,
            subject: `RSVP Confirmed: ${props.eventTitle}`,
            html: emailHtml,
            // Add text version for better deliverability
            text: generateTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'rsvp-confirmation' },
                { name: 'event', value: props.eventSlug || 'unknown' },
                { name: 'user-type', value: props.isAuthenticated ? 'authenticated' : 'guest' }
            ],
            // Add reply-to organizer email
            replyTo: props.organizerEmail,
        });

        console.log('RSVP confirmation email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            eventTitle: props.eventTitle,
            rsvpId: props.rsvpId
        });

        return {
            success: true,
            messageId: response.data?.id
        };

    } catch (error) {
        console.error('Failed to send RSVP confirmation email:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the email for better deliverability
 */
function generateTextVersion(props: SendRSVPConfirmationProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${props.eventSlug}`;

    return `
RSVP CONFIRMED!

Hi ${props.userName},

Great news! Your RSVP for "${props.eventTitle}" has been confirmed.${props.guestCount > 1 ? ` You've reserved ${props.guestCount} spots for this event.` : ''}

EVENT DETAILS:
📅 Date: ${props.eventDate}
🕐 Time: ${props.eventTime}
📍 Location: ${props.eventLocation}
🏢 Address: ${props.eventAddress}
👤 Organizer: ${props.organizerName}
${props.guestCount > 1 ? `👥 Guests: ${props.guestCount} people\n` : ''}

${props.eventDescription}

QUICK ACTIONS:
• View Event Details: ${eventUrl}
• Add to Google Calendar: https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(props.eventTitle)}

${props.cancellationDeadline ? `CANCELLATION POLICY:
You can cancel your RSVP until ${props.cancellationDeadline}. After this time, cancellations may not be allowed.

` : ''}NEED TO MAKE CHANGES?
${props.isAuthenticated
            ? `Visit your My Events page to manage your RSVPs: ${baseUrl}/my-events`
            : `Contact the organizer at ${props.organizerEmail} or reply to this email with your RSVP ID: ${props.rsvpId}`
        }

Questions? Contact ${props.organizerName} at ${props.organizerEmail}

---
This email was sent by LocalLoop. You're receiving this because you signed up for ${props.eventTitle}.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.userEmail)}
  `.trim();
}

/**
 * Send welcome email to new users (future feature)
 */
export async function sendWelcomeEmail(
    to: string,
    userName: string
): Promise<EmailServiceResponse> {
    try {
        if (!process.env.RESEND_API_KEY) {
            return { success: false, error: 'Email service not configured' };
        }

        // This is a placeholder for future welcome email implementation
        console.log('Welcome email would be sent to:', to, 'for user:', userName);

        return { success: true, messageId: 'welcome-placeholder' };
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Send event reminder email (future feature)
 */
export async function sendEventReminderEmail(
    to: string,
    eventTitle: string
): Promise<EmailServiceResponse> {
    try {
        if (!process.env.RESEND_API_KEY) {
            return { success: false, error: 'Email service not configured' };
        }

        // This is a placeholder for future reminder email implementation
        console.log('Reminder email would be sent to:', to, 'for event:', eventTitle);

        return { success: true, messageId: 'reminder-placeholder' };
    } catch (error) {
        console.error('Failed to send event reminder email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Send event cancellation email (future feature)
 */
export async function sendEventCancellationEmail(
    to: string,
    eventTitle: string
): Promise<EmailServiceResponse> {
    try {
        if (!process.env.RESEND_API_KEY) {
            return { success: false, error: 'Email service not configured' };
        }

        // This is a placeholder for future cancellation email implementation
        console.log('Cancellation email would be sent to:', to, 'for event:', eventTitle);

        return { success: true, messageId: 'cancellation-placeholder' };
    } catch (error) {
        console.error('Failed to send event cancellation email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Send RSVP cancellation email to user
 */
export async function sendRSVPCancellationEmail(
    props: SendRSVPCancellationProps
): Promise<EmailServiceResponse> {
    try {
        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured - email sending disabled');
            return {
                success: false,
                error: 'Email service not configured'
            };
        }

        // Render the email template
        const emailHtml = await render(RSVPCancellationEmail(props));

        // Send the email
        const response = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'LocalLoop <noreply@localloop.app>',
            to: props.to,
            subject: `RSVP Cancelled: ${props.eventTitle}`,
            html: emailHtml,
            // Add text version for better deliverability
            text: generateCancellationTextVersion(props),
            // Add tags for tracking
            tags: [
                { name: 'type', value: 'rsvp-cancellation' },
                { name: 'event', value: props.eventSlug || 'unknown' }
            ],
            // Add reply-to organizer email
            replyTo: props.organizerEmail,
        });

        console.log('RSVP cancellation email sent successfully:', {
            messageId: response.data?.id,
            to: props.to,
            eventTitle: props.eventTitle,
            rsvpId: props.rsvpId
        });

        return {
            success: true,
            messageId: response.data?.id
        };

    } catch (error) {
        console.error('Failed to send RSVP cancellation email:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Generate text version of the cancellation email for better deliverability
 */
function generateCancellationTextVersion(props: SendRSVPCancellationProps): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${props.eventSlug}`;

    return `
RSVP CANCELLED

Hi ${props.userName},

This email confirms that your RSVP for "${props.eventTitle}" has been cancelled.${props.cancellationReason ? ` Reason: ${props.cancellationReason}` : ''}

EVENT DETAILS:
📅 Date: ${props.eventDate}
🕐 Time: ${props.eventTime}
📍 Location: ${props.eventLocation}
🏢 Address: ${props.eventAddress}
👤 Organizer: ${props.organizerName}
🆔 RSVP ID: ${props.rsvpId}

${props.eventDescription}

QUICK ACTIONS:
• View Event Details: ${eventUrl}
• RSVP Again (if still open): ${eventUrl}

WHAT'S NEXT?
• Your spot has been freed up for other attendees
• You can still view the event details and RSVP again if registration is still open
• If you have any questions, please contact the organizer

Questions or concerns? Contact ${props.organizerName} at ${props.organizerEmail} for any questions about this cancellation.

---
This email was sent by LocalLoop regarding your RSVP cancellation.
Unsubscribe: ${baseUrl}/unsubscribe?email=${encodeURIComponent(props.userEmail)}
  `.trim();
} 