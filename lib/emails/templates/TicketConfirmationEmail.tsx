import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Row,
    Column,
} from '@react-email/components';

interface TicketItem {
    ticketType: string;
    quantity: number;
    totalPaid: number;
}

interface TicketConfirmationEmailProps {
    customerName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    tickets: TicketItem[];
    totalPaid: number;
    paymentIntentId: string;
    ticketIds: string[];
}

export function TicketConfirmationEmail({
    customerName = 'Customer',
    eventTitle = 'Sample Event',
    eventDate = 'TBD',
    eventTime = 'TBD',
    eventLocation = 'TBD',
    tickets = [],
    totalPaid = 0,
    paymentIntentId = 'sample_pi_123',
    ticketIds = []
}: TicketConfirmationEmailProps) {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Html>
            <Head />
            <Preview>Your tickets for {eventTitle} are confirmed!</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>🎟️ Ticket Confirmation</Heading>
                        <Text style={headerText}>
                            Your tickets are confirmed for {eventTitle}
                        </Text>
                    </Section>

                    {/* Greeting */}
                    <Section style={section}>
                        <Text style={text}>Hi {customerName},</Text>
                        <Text style={text}>
                            Thank you for purchasing tickets! We&apos;re excited to see you at <strong>{eventTitle}</strong>.
                        </Text>
                    </Section>

                    {/* Event Details */}
                    <Section style={section}>
                        <Heading style={h2}>Event Details</Heading>
                        <div style={eventDetails}>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={labelText}>📅 Date:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={valueText}>{formattedDate}</Text>
                                </Column>
                            </Row>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={labelText}>🕐 Time:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={valueText}>{eventTime}</Text>
                                </Column>
                            </Row>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={labelText}>📍 Location:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={valueText}>{eventLocation}</Text>
                                </Column>
                            </Row>
                        </div>
                    </Section>

                    <Hr style={divider} />

                    {/* Ticket Information */}
                    <Section style={section}>
                        <Heading style={h2}>Your Tickets</Heading>
                        <div style={ticketContainer}>
                            {tickets.map((ticket, index) => (
                                <div key={index} style={ticketItem}>
                                    <Row>
                                        <Column style={{ width: '60%' }}>
                                            <Text style={ticketType}>{ticket.ticketType}</Text>
                                            <Text style={ticketQuantity}>Quantity: {ticket.quantity}</Text>
                                        </Column>
                                        <Column style={{ width: '40%', textAlign: 'right' as const }}>
                                            <Text style={ticketPrice}>${(ticket.totalPaid / 100).toFixed(2)}</Text>
                                        </Column>
                                    </Row>
                                </div>
                            ))}
                        </div>

                        <div style={totalSection}>
                            <Row>
                                <Column style={{ width: '60%' }}>
                                    <Text style={totalLabel}>Total Paid:</Text>
                                </Column>
                                <Column style={{ width: '40%', textAlign: 'right' as const }}>
                                    <Text style={totalAmount}>${(totalPaid / 100).toFixed(2)}</Text>
                                </Column>
                            </Row>
                        </div>
                    </Section>

                    <Hr style={divider} />

                    {/* Payment & Ticket Details */}
                    <Section style={section}>
                        <Heading style={h2}>Confirmation Details</Heading>
                        <div style={confirmationDetails}>
                            <Text style={confirmationText}>
                                <strong>Payment ID:</strong> {paymentIntentId}
                            </Text>
                            <Text style={confirmationText}>
                                <strong>Ticket IDs:</strong> {ticketIds.join(', ')}
                            </Text>
                        </div>
                    </Section>

                    {/* Important Information */}
                    <Section style={section}>
                        <div style={importantBox}>
                            <Text style={importantTitle}>📋 Important Information</Text>
                            <Text style={importantText}>
                                • Please save this email as your ticket confirmation
                            </Text>
                            <Text style={importantText}>
                                • You may need to present this email or your payment confirmation at the event
                            </Text>
                            <Text style={importantText}>
                                • Arrive early to ensure smooth entry
                            </Text>
                            <Text style={importantText}>
                                • Contact us if you have any questions about your tickets
                            </Text>
                        </div>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Hr style={divider} />
                        <Text style={footerText}>
                            Thank you for choosing LocalLoop Events!
                        </Text>
                        <Text style={footerText}>
                            We can&apos;t wait to see you at {eventTitle}.
                        </Text>
                        <Text style={footerNote}>
                            Best regards,<br />
                            The LocalLoop Events Team
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

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
    maxWidth: '600px',
};

const header = {
    padding: '32px 24px',
    backgroundColor: '#4f46e5',
    textAlign: 'center' as const,
};

const h1 = {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '0 0 8px',
};

const headerText = {
    color: '#e0e7ff',
    fontSize: '16px',
    textAlign: 'center' as const,
    margin: '0',
};

const section = {
    padding: '24px',
};

const h2 = {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 16px',
};

const text = {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px',
};

const eventDetails = {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
};

const detailRow = {
    marginBottom: '8px',
};

const detailLabel = {
    width: '30%',
};

const detailValue = {
    width: '70%',
};

const labelText = {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
};

const valueText = {
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0',
};

const ticketContainer = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
};

const ticketItem = {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
};

const ticketType = {
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px',
};

const ticketQuantity = {
    color: '#6b7280',
    fontSize: '14px',
    margin: '0',
};

const ticketPrice = {
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
};

const totalSection = {
    backgroundColor: '#4f46e5',
    padding: '16px',
    marginTop: '16px',
    borderRadius: '8px',
};

const totalLabel = {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
};

const totalAmount = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
};

const confirmationDetails = {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
};

const confirmationText = {
    color: '#4b5563',
    fontSize: '14px',
    margin: '0 0 8px',
    fontFamily: 'monospace',
};

const importantBox = {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px',
};

const importantTitle = {
    color: '#92400e',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 12px',
};

const importantText = {
    color: '#92400e',
    fontSize: '14px',
    margin: '0 0 4px',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '24px 0',
};

const footer = {
    padding: '0 24px 24px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#4b5563',
    fontSize: '16px',
    margin: '0 0 8px',
};

const footerNote = {
    color: '#6b7280',
    fontSize: '14px',
    margin: '16px 0 0',
}; 