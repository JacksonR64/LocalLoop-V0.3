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

interface RSVPCancellationEmailProps {
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

export const RSVPCancellationEmail = ({
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
    cancellationReason,
    eventSlug,
}: RSVPCancellationEmailProps) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const eventUrl = `${baseUrl}/events/${eventSlug}`;

    return (
        <Html>
            <Head />
            <Preview>Your RSVP for {eventTitle} has been cancelled</Preview>
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
                        <Heading style={h1}>RSVP Cancelled</Heading>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>
                            Hi {userName},
                        </Text>

                        <Text style={paragraph}>
                            This email confirms that your RSVP for <strong>{eventTitle}</strong> has been cancelled.
                            {cancellationReason && ` Reason: ${cancellationReason}`}
                        </Text>

                        {/* Event Details Card */}
                        <Section style={eventCard}>
                            <Heading style={eventTitleStyle}>🚫 {eventTitle} (Cancelled RSVP)</Heading>

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
                                <Text style={detailItem}>
                                    <strong>🆔 RSVP ID:</strong> {rsvpId}
                                </Text>
                            </Section>

                            <Text style={description}>
                                {eventDescription}
                            </Text>
                        </Section>

                        {/* Action Buttons */}
                        <Section style={buttonContainer}>
                            <Button style={primaryButton} href={eventUrl}>
                                📋 View Event Details
                            </Button>

                            <Button style={secondaryButton} href={eventUrl}>
                                🔄 RSVP Again (if still open)
                            </Button>
                        </Section>

                        {/* Info Box */}
                        <Section style={infoBox}>
                            <Text style={infoText}>
                                <strong>What&apos;s Next?</strong>
                                <br />
                                • Your spot has been freed up for other attendees
                                <br />
                                • You can still view the event details and RSVP again if registration is still open
                                <br />
                                • If you have any questions, please contact the organizer
                            </Text>
                        </Section>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>Questions or concerns?</strong>
                        </Text>

                        <Text style={footerText}>
                            Contact the organizer at <Link href={`mailto:${organizerEmail}`} style={link}>{organizerName}</Link>
                            ({organizerEmail}) for any questions about this cancellation.
                        </Text>

                        <Hr style={divider} />

                        <Text style={footerSmall}>
                            This email was sent by LocalLoop regarding your RSVP cancellation.
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

// Styles (similar to confirmation email but with different colors for cancellation)
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
    backgroundColor: '#ef4444', // Red for cancellation
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
    backgroundColor: '#fef2f2', // Light red background
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
};

const eventTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#dc2626', // Red color for cancelled
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
    borderTop: '1px solid #fca5a5',
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
    backgroundColor: '#f0f9ff', // Light blue for info
    border: '1px solid #38bdf8',
    borderRadius: '6px',
    padding: '16px',
    margin: '24px 0',
};

const infoText = {
    fontSize: '14px',
    color: '#0369a1',
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

export default RSVPCancellationEmail; 