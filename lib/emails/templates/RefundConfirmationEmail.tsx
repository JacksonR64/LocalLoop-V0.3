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

interface RefundItem {
    ticketType: string;
    quantity: number;
    originalPrice: number;
    refundAmount: number;
}

interface RefundConfirmationEmailProps {
    customerName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    refundedTickets: RefundItem[];
    totalRefundAmount: number;
    originalOrderAmount: number;
    refundType: 'full_cancellation' | 'customer_request';
    stripeRefundId: string;
    orderId: string;
    processingTimeframe: string;
    refundReason?: string;
    remainingAmount?: number;
}

export function RefundConfirmationEmail({
    customerName = 'Customer',
    eventTitle = 'Sample Event',
    eventDate = 'TBD',
    eventTime = 'TBD',
    eventLocation = 'TBD',
    refundedTickets = [],
    totalRefundAmount = 0,
    originalOrderAmount = 0,
    refundType = 'customer_request',
    stripeRefundId = 'sample_re_123',
    orderId = 'sample_order_123',
    processingTimeframe = '5-10 business days',
    refundReason,
    remainingAmount = 0
}: RefundConfirmationEmailProps) {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isFullRefund = remainingAmount === 0;
    const isEventCancellation = refundType === 'full_cancellation';

    return (
        <Html>
            <Head />
            <Preview>Your refund for {eventTitle} has been processed</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>💰 Refund Confirmation</Heading>
                        <Text style={headerText}>
                            Your refund for {eventTitle} has been processed
                        </Text>
                    </Section>

                    {/* Greeting */}
                    <Section style={section}>
                        <Text style={text}>Hi {customerName},</Text>
                        <Text style={text}>
                            {isEventCancellation ? (
                                <>We&apos;re sorry to inform you that <strong>{eventTitle}</strong> has been cancelled.
                                    Your refund has been processed automatically.</>
                            ) : (
                                <>Your refund request for <strong>{eventTitle}</strong> has been processed successfully.</>
                            )}
                        </Text>
                    </Section>

                    {/* Refund Details */}
                    <Section style={section}>
                        <Heading style={h2}>Refund Details</Heading>
                        <div style={refundSummary}>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={labelText}>💰 Refund Amount:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={refundAmountText}>${(totalRefundAmount / 100).toFixed(2)}</Text>
                                </Column>
                            </Row>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={labelText}>📋 Order ID:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={valueText}>{orderId}</Text>
                                </Column>
                            </Row>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={labelText}>🏦 Refund ID:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={valueText}>{stripeRefundId}</Text>
                                </Column>
                            </Row>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={labelText}>⏰ Processing Time:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={valueText}>{processingTimeframe}</Text>
                                </Column>
                            </Row>
                        </div>
                    </Section>

                    <Hr style={divider} />

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

                    {/* Refunded Tickets */}
                    <Section style={section}>
                        <Heading style={h2}>Refunded Tickets</Heading>
                        <div style={ticketContainer}>
                            {refundedTickets.map((ticket, index) => (
                                <div key={index} style={ticketItem}>
                                    <Row>
                                        <Column style={{ width: '50%' }}>
                                            <Text style={ticketType}>{ticket.ticketType}</Text>
                                            <Text style={ticketQuantity}>Quantity: {ticket.quantity}</Text>
                                        </Column>
                                        <Column style={{ width: '25%', textAlign: 'center' as const }}>
                                            <Text style={originalPrice}>Original: ${(ticket.originalPrice / 100).toFixed(2)}</Text>
                                        </Column>
                                        <Column style={{ width: '25%', textAlign: 'right' as const }}>
                                            <Text style={ticketPrice}>Refund: ${(ticket.refundAmount / 100).toFixed(2)}</Text>
                                        </Column>
                                    </Row>
                                </div>
                            ))}
                        </div>

                        <div style={totalSection}>
                            <Row>
                                <Column style={{ width: '50%' }}>
                                    <Text style={totalLabel}>Original Order Total:</Text>
                                </Column>
                                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                                    <Text style={originalAmount}>${(originalOrderAmount / 100).toFixed(2)}</Text>
                                </Column>
                            </Row>
                            <Row>
                                <Column style={{ width: '50%' }}>
                                    <Text style={totalLabel}>Total Refund Amount:</Text>
                                </Column>
                                <Column style={{ width: '50%', textAlign: 'right' as const }}>
                                    <Text style={totalAmount}>${(totalRefundAmount / 100).toFixed(2)}</Text>
                                </Column>
                            </Row>
                            {!isFullRefund && (
                                <Row>
                                    <Column style={{ width: '50%' }}>
                                        <Text style={totalLabel}>Remaining Balance:</Text>
                                    </Column>
                                    <Column style={{ width: '50%', textAlign: 'right' as const }}>
                                        <Text style={remainingBalance}>${(remainingAmount / 100).toFixed(2)}</Text>
                                    </Column>
                                </Row>
                            )}
                        </div>
                    </Section>

                    <Hr style={divider} />

                    {/* Refund Information */}
                    <Section style={section}>
                        <div style={infoBox}>
                            <Text style={infoTitle}>📋 Refund Information</Text>
                            <Text style={infoText}>
                                • Your refund will appear on your original payment method within {processingTimeframe}
                            </Text>
                            <Text style={infoText}>
                                • Keep this email as proof of your refund processing
                            </Text>
                            {!isEventCancellation && (
                                <Text style={infoText}>
                                    • Processing fees may apply as shown in the refund amount above
                                </Text>
                            )}
                            <Text style={infoText}>
                                • Contact us if you have any questions about your refund
                            </Text>
                            {refundReason && (
                                <Text style={infoText}>
                                    • Refund reason: {refundReason}
                                </Text>
                            )}
                        </div>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Hr style={divider} />
                        <Text style={footerText}>
                            {isEventCancellation ? (
                                <>We apologize for any inconvenience caused by the event cancellation.</>
                            ) : (
                                <>Thank you for your understanding.</>
                            )}
                        </Text>
                        <Text style={footerText}>
                            If you have any questions about this refund, please don&apos;t hesitate to contact us.
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
    width: '560px',
};

const header = {
    backgroundColor: '#dc2626',
    padding: '20px 40px',
    textAlign: 'center' as const,
};

const h1 = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 10px',
    textAlign: 'center' as const,
};

const headerText = {
    color: '#ffffff',
    fontSize: '16px',
    margin: '0',
    textAlign: 'center' as const,
};

const section = {
    padding: '32px 40px',
};

const text = {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left' as const,
};

const h2 = {
    color: '#32325d',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 16px',
};

const refundSummary = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #e2e8f0',
};

const eventDetails = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #e2e8f0',
};

const detailRow = {
    marginBottom: '12px',
};

const detailLabel = {
    width: '40%',
    verticalAlign: 'top' as const,
};

const detailValue = {
    width: '60%',
    verticalAlign: 'top' as const,
};

const labelText = {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
};

const valueText = {
    color: '#1e293b',
    fontSize: '14px',
    margin: '0',
};

const refundAmountText = {
    color: '#059669',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0',
};

const divider = {
    borderColor: '#e2e8f0',
    margin: '0',
};

const ticketContainer = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #e2e8f0',
};

const ticketItem = {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
    marginBottom: '12px',
};

const ticketType = {
    color: '#1e293b',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 4px',
};

const ticketQuantity = {
    color: '#64748b',
    fontSize: '14px',
    margin: '0',
};

const originalPrice = {
    color: '#64748b',
    fontSize: '14px',
    margin: '0',
    textDecoration: 'line-through',
};

const ticketPrice = {
    color: '#059669',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0',
};

const totalSection = {
    backgroundColor: '#ffffff',
    borderTop: '2px solid #e2e8f0',
    paddingTop: '16px',
    marginTop: '16px',
};

const totalLabel = {
    color: '#1e293b',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 8px',
};

const originalAmount = {
    color: '#64748b',
    fontSize: '16px',
    margin: '0 0 8px',
    textDecoration: 'line-through',
};

const totalAmount = {
    color: '#059669',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 8px',
};

const remainingBalance = {
    color: '#dc2626',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 8px',
};

const infoBox = {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '20px',
};

const infoTitle = {
    color: '#92400e',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 12px',
};

const infoText = {
    color: '#92400e',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 8px',
};

const footer = {
    padding: '32px 40px 16px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '20px',
    textAlign: 'center' as const,
};

const footerNote = {
    color: '#64748b',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '16px 0 0',
    textAlign: 'center' as const,
};

export default RefundConfirmationEmail; 