import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Link,
    Hr,
    Img,
    Button,
    Preview,
    Heading,
} from '@react-email/components';
import * as React from 'react';

interface EventReminderEmailProps {
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
    rsvpId?: string;
    isTicketHolder?: boolean;
    ticketCount?: number;
    reminderType: '24h' | '1h' | 'custom';
    eventSlug?: string;
    timeUntilEvent?: string;
}

export const EventReminderEmail = ({
    userName,
    userEmail,
    eventTitle,
    eventDescription,
    eventDate,
    eventTime,
    eventLocation,
    eventAddress,
    organizerName,
    organizerEmail,
    rsvpId,
    isTicketHolder = false,
    ticketCount = 1,
    reminderType,
    eventSlug,
    timeUntilEvent,
}: EventReminderEmailProps) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${eventSlug}`;

    // Google Calendar URL
    const calendarTitle = encodeURIComponent(eventTitle);
    const calendarDescription = encodeURIComponent(eventDescription);
    const calendarLocation = encodeURIComponent(`${eventLocation}, ${eventAddress}`);
    const startDate = new Date(`${eventDate} ${eventTime}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hour duration
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${calendarDescription}&location=${calendarLocation}`;

    const getReminderTitle = () => {
        switch (reminderType) {
            case '24h':
                return 'Event Reminder: Tomorrow!';
            case '1h':
                return 'Starting Soon: 1 Hour to Go!';
            default:
                return 'Event Reminder';
        }
    };

    const getReminderMessage = () => {
        switch (reminderType) {
            case '24h':
                return "Your event is coming up tomorrow! Don't forget to attend.";
            case '1h':
                return "Your event starts in just 1 hour! Time to get ready.";
            default:
                return timeUntilEvent ? `Your event starts ${timeUntilEvent}!` : 'Your event is coming up soon!';
        }
    };

    return (
        <Html>
            <Head />
            <Preview>{getReminderTitle()} - {eventTitle}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src={`${baseUrl}/logo.svg`}
                            width="50"
                            height="50"
                            alt="LocalLoop"
                            style={logo}
                        />
                        <Heading style={h1}>🔔 {getReminderTitle()}</Heading>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>
                            Hi {userName},
                        </Text>

                        <Text style={paragraph}>
                            {getReminderMessage()}
                        </Text>

                        {/* Event Details Card */}
                        <Section style={eventCard}>
                            <Heading style={eventTitleStyle}>{eventTitle}</Heading>

                            <Section style={eventDetails}>
                                <Text style={detailItem}>
                                    <strong>📅 Date:</strong> {eventDate}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>🕐 Time:</strong> {eventTime}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>📍 Location:</strong> {eventLocation}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>🏢 Address:</strong> {eventAddress}
                                </Text>
                                <Text style={detailItem}>
                                    <strong>👤 Organizer:</strong> {organizerName}
                                </Text>
                                {isTicketHolder && ticketCount > 1 && (
                                    <Text style={detailItem}>
                                        <strong>🎫 Tickets:</strong> {ticketCount} tickets
                                    </Text>
                                )}
                            </Section>

                            <Text style={description}>
                                {eventDescription}
                            </Text>
                        </Section>

                        {/* Status Badge */}
                        {isTicketHolder ? (
                            <Section style={statusBadge}>
                                <Text style={statusText}>
                                    🎫 <strong>Ticket Holder</strong> - You&apos;re all set to attend!
                                </Text>
                            </Section>
                        ) : (
                            <Section style={statusBadge}>
                                <Text style={statusText}>
                                    ✅ <strong>RSVP Confirmed</strong> - You&apos;re registered to attend!
                                </Text>
                            </Section>
                        )}

                        {/* Reminder Tips */}
                        <Section style={tipSection}>
                            <Heading style={h3}>📋 Pre-Event Checklist:</Heading>
                            <Text style={tipItem}>
                                • Know the exact location and arrive a few minutes early
                            </Text>
                            <Text style={tipItem}>
                                • Bring any required items or documents
                            </Text>
                            {isTicketHolder && (
                                <Text style={tipItem}>
                                    • Keep your ticket confirmation email handy
                                </Text>
                            )}
                            <Text style={tipItem}>
                                • Check the weather and dress appropriately
                            </Text>
                            <Text style={tipItem}>
                                • Contact the organizer if you have any last-minute questions
                            </Text>
                        </Section>

                        {/* Action Buttons */}
                        <Section style={buttonContainer}>
                            <Button style={primaryButton} href={eventUrl}>
                                📋 View Event Details
                            </Button>

                            <Button style={secondaryButton} href={googleCalendarUrl}>
                                📅 Add to Calendar
                            </Button>
                        </Section>

                        {/* Directions Section */}
                        <Section style={directionsSection}>
                            <Heading style={h3}>🗺️ Getting There:</Heading>
                            <Text style={addressText}>
                                {eventLocation}<br />
                                {eventAddress}
                            </Text>

                            <Button
                                style={directionsButton}
                                href={`https://maps.google.com/maps?q=${encodeURIComponent(eventAddress)}`}
                            >
                                📍 Get Directions
                            </Button>
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>Questions about the event?</strong>
                        </Text>

                        <Text style={footerText}>
                            Contact the organizer: <Link href={`mailto:${organizerEmail}`} style={link}>{organizerName}</Link>
                        </Text>

                        {rsvpId && (
                            <Text style={footerText}>
                                Your RSVP ID: <strong>{rsvpId}</strong>
                            </Text>
                        )}

                        <Hr style={divider} />

                        <Text style={footerSmall}>
                            This reminder was sent by LocalLoop. You&apos;re receiving this because you&apos;re registered for {eventTitle}.
                            <br />
                            <Link href={`${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`} style={unsubscribeLink}>
                                Unsubscribe from event reminders
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const header = {
    padding: '32px 24px',
    textAlign: 'center' as const,
    backgroundColor: '#f59e0b',
    borderRadius: '12px 12px 0 0',
};

const logo = {
    margin: '0 auto',
    borderRadius: '8px',
};

const h1 = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '16px 0 0',
    padding: '0',
    lineHeight: '1.3',
};

const h3 = {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '600',
    margin: '20px 0 12px',
    padding: '0',
};

const content = {
    padding: '32px 24px',
};

const greeting = {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 24px',
};

const paragraph = {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 24px',
    fontWeight: '500',
};

const eventCard = {
    backgroundColor: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
};

const eventTitleStyle = {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 20px',
    padding: '0',
    lineHeight: '1.3',
};

const eventDetails = {
    margin: '20px 0',
};

const detailItem = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 8px',
};

const description = {
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '20px 0 0',
    fontStyle: 'italic',
};

const statusBadge = {
    backgroundColor: '#ecfdf5',
    border: '2px solid #10b981',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const statusText = {
    color: '#047857',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
};

const tipSection = {
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    padding: '24px',
    margin: '32px 0',
};

const tipItem = {
    color: '#9a3412',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 8px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const primaryButton = {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 32px',
    margin: '8px 16px',
    minWidth: '180px',
};

const secondaryButton = {
    backgroundColor: '#ffffff',
    border: '2px solid #6366f1',
    borderRadius: '8px',
    color: '#6366f1',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 30px',
    margin: '8px 16px',
    minWidth: '180px',
};

const directionsSection = {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '24px',
    margin: '32px 0',
    textAlign: 'center' as const,
};

const addressText = {
    color: '#0c4a6e',
    fontSize: '16px',
    fontWeight: '500',
    lineHeight: '1.6',
    margin: '0 0 16px',
};

const directionsButton = {
    backgroundColor: '#0ea5e9',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    margin: '0',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '32px 0',
};

const footer = {
    padding: '0 24px 32px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 8px',
};

const footerSmall = {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '16px 0 0',
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

const unsubscribeLink = {
    color: '#9ca3af',
    textDecoration: 'underline',
    fontSize: '12px',
};

export default EventReminderEmail; 