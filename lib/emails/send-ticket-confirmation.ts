import { Resend } from 'resend';
import { TicketConfirmationEmail } from './templates/TicketConfirmationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

interface TicketItem {
    ticketType: string;
    quantity: number;
    totalPaid: number;
}

interface SendTicketConfirmationEmailProps {
    to: string;
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

export async function sendTicketConfirmationEmail({
    to,
    customerName,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    tickets,
    totalPaid,
    paymentIntentId,
    ticketIds
}: SendTicketConfirmationEmailProps) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'LocalLoop Events <tickets@localloop.com>',
            to: [to],
            subject: `Ticket Confirmation - ${eventTitle}`,
            react: TicketConfirmationEmail({
                customerName,
                eventTitle,
                eventDate,
                eventTime,
                eventLocation,
                tickets,
                totalPaid,
                paymentIntentId,
                ticketIds
            }),
            text: `
Ticket Confirmation - ${eventTitle}

Hi ${customerName},

Thank you for purchasing tickets to ${eventTitle}!

Event Details:
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${eventLocation}

Your Tickets:
${tickets.map(ticket => `- ${ticket.quantity}x ${ticket.ticketType} - $${(ticket.totalPaid / 100).toFixed(2)}`).join('\n')}

Total Paid: $${(totalPaid / 100).toFixed(2)}
Payment ID: ${paymentIntentId}

Ticket IDs: ${ticketIds.join(', ')}

Please save this email as confirmation of your purchase. You may need to present this at the event.

See you at the event!

Best regards,
The LocalLoop Events Team
            `.trim(),
        });

        if (error) {
            console.error('Failed to send ticket confirmation email:', error);
            throw error;
        }

        console.log('Ticket confirmation email sent successfully:', data?.id);
        return data;
    } catch (error) {
        console.error('Error sending ticket confirmation email:', error);
        throw error;
    }
} 