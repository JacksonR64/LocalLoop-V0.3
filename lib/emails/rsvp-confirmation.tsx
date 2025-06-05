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

interface RSVPConfirmationEmailProps {
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

export const RSVPConfirmationEmail = ({
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
    guestCount,
    isAuthenticated,
    eventSlug,
    cancellationDeadline,
}: RSVPConfirmationEmailProps) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${eventSlug}`;
    const calendarTitle = encodeURIComponent(eventTitle);
    const calendarDescription = encodeURIComponent(eventDescription);
    const calendarLocation = encodeURIComponent(`${eventLocation}, ${eventAddress}`);

    // Convert date/time to Google Calendar format (YYYYMMDDTHHMMSSZ)
    const startDate = new Date(`${eventDate} ${eventTime}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour duration
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${calendarDescription}&location=${calendarLocation}`;

    return (
        <Html>
            <Head />
            <Preview>Your RSVP for {eventTitle} is confirmed!</Preview>
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
                        <Heading style={h1}>RSVP Confirmed!</Heading>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>
                            Hi {userName},
                        </Text>

                        <Text style={paragraph}>
                            Great news! Your RSVP for <strong>{eventTitle}</strong> has been confirmed.
                            {guestCount > 1 ? ` You&apos;ve reserved ${guestCount} spots for this event.` : ''}
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
                                {guestCount > 1 && (
                                    <Text style={detailItem}>
                                        <strong>👥 Guests:</strong> {guestCount} people
                                    </Text>
                                )}
                            </Section>

                            <Text style={description}>
                                {eventDescription}
                            </Text>
                        </Section>

                        {/* Action Buttons */}
                        <Section style={buttonContainer}>
                            <Button style={primaryButton} href={googleCalendarUrl}>
                                📅 Add to Google Calendar
                            </Button>

                            <Button style={secondaryButton} href={eventUrl}>
                                📋 View Event Details
                            </Button>
                        </Section>

                        {/* Cancellation Info */}
                        {cancellationDeadline && (
                            <Section style={infoBox}>
                                <Text style={infoText}>
                                    <strong>Cancellation Policy:</strong> You can cancel your RSVP until {cancellationDeadline}.
                                    After this time, cancellations may not be allowed.
                                </Text>
                            </Section>
                        )}
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>Need to make changes?</strong>
                        </Text>

                        {isAuthenticated ? (
                            <Text style={footerText}>
                                Visit your <Link href={`${baseUrl}/my-events`} style={link}>My Events</Link> page to manage your RSVPs.
                            </Text>
                        ) : (
                            <Text style={footerText}>
                                Contact the organizer at <Link href={`mailto:${organizerEmail}`} style={link}>{organizerEmail}</Link>
                                or reply to this email with your RSVP ID: <strong>{rsvpId}</strong>
                            </Text>
                        )}

                        <Text style={footerText}>
                            Questions? Contact <Link href={`mailto:${organizerEmail}`} style={link}>{organizerName}</Link>
                        </Text>

                        <Hr style={divider} />

                        <Text style={footerSmall}>
                            This email was sent by LocalLoop. You&apos;re receiving this because you signed up for {eventTitle}.
                            <br />
                            <Link href={`${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`} style={unsubscribeLink}>
                                Unsubscribe from event notifications
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
    backgroundColor: '#6366f1',
    borderRadius: '8px 8px 0 0',
};

const logo = {
    margin: '0 auto',
};

const h1 = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '16px 0 0 0',
};

const content = {
    padding: '24px',
};

const greeting = {
    fontSize: '18px',
    color: '#1f2937',
    fontWeight: '600',
    margin: '0 0 16px 0',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    margin: '0 0 24px 0',
};

const eventCard = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
};

const eventTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 16px 0',
};

const eventDetails = {
    margin: '16px 0',
};

const detailItem = {
    fontSize: '14px',
    color: '#374151',
    margin: '8px 0',
    lineHeight: '20px',
};

const description = {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '20px',
    margin: '16px 0 0 0',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const primaryButton = {
    backgroundColor: '#6366f1',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    margin: '0 8px 16px 8px',
    fontWeight: '600',
};

const secondaryButton = {
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#374151',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    margin: '0 8px 16px 8px',
    fontWeight: '600',
};

const infoBox = {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    padding: '16px',
    margin: '24px 0',
};

const infoText = {
    fontSize: '14px',
    color: '#92400e',
    margin: '0',
    lineHeight: '20px',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '32px 0',
};

const footer = {
    padding: '0 24px',
};

const footerText = {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '20px',
    margin: '8px 0',
};

const footerSmall = {
    fontSize: '12px',
    color: '#9ca3af',
    lineHeight: '18px',
    margin: '16px 0 0 0',
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

const unsubscribeLink = {
    color: '#9ca3af',
    textDecoration: 'underline',
};

export default RSVPConfirmationEmail; 