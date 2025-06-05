// CSV Export Utility Library for LocalLoop
// Handles various data exports with proper formatting and file generation

export interface CSVExportOptions {
    filename?: string
    includeHeaders?: boolean
    dateFormat?: 'short' | 'long' | 'iso'
    currencyFormat?: 'usd' | 'number'
    customFields?: string[]
    filterEmpty?: boolean
}

export interface AttendeeExportData {
    id: string
    type: 'ticket' | 'rsvp'
    name: string
    email: string
    eventId: string
    eventTitle: string
    eventStartTime: string
    eventLocation: string
    status: string
    checkedInAt: string | null
    createdAt: string
    ticketType: string
    ticketPrice: number
    confirmationCode: string | null
    orderId: string | null
    orderTotal: number | null
    orderStatus: string | null
    userId: string | null
    attendeeCount: number
}

export interface AnalyticsExportData {
    eventId: string
    eventTitle: string
    eventDate: string
    totalAttendees: number
    totalRevenue: number
    capacity: number
    conversionRate: number
    rsvpCount: number
    ticketCount: number
    checkInRate: number
}

export interface EventExportData {
    id: string
    title: string
    description: string
    startTime: string
    endTime: string
    location: string
    capacity: number
    status: string
    published: boolean
    createdAt: string
    totalAttendees: number
    totalRevenue: number
    ticketTypes: string
}

class CSVExporter {
    private formatDate(date: string | Date, format: 'short' | 'long' | 'iso' = 'short'): string {
        const d = new Date(date)

        switch (format) {
            case 'long':
                return d.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            case 'iso':
                return d.toISOString()
            default:
                return d.toLocaleDateString('en-US')
        }
    }

    private formatCurrency(amount: number, format: 'usd' | 'number' = 'usd'): string {
        if (format === 'number') {
            return (amount / 100).toFixed(2)
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount / 100)
    }

    private escapeCSVValue(value: unknown): string {
        if (value === null || value === undefined) {
            return ''
        }

        const str = String(value)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    private generateCSVContent(data: Record<string, unknown>[], headers: string[]): string {
        const rows = [headers]

        data.forEach(item => {
            const row = headers.map(header => this.escapeCSVValue(item[header]))
            rows.push(row)
        })

        return rows.map(row => row.join(',')).join('\n')
    }

    private downloadCSV(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', filename)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    async exportAttendees(
        attendees: AttendeeExportData[],
        options: CSVExportOptions = {}
    ): Promise<void> {
        const {
            filename = `attendees-export-${new Date().toISOString().split('T')[0]}.csv`,
            dateFormat = 'short',
            currencyFormat = 'usd',
            customFields,
            filterEmpty = true
        } = options

        // Filter out empty attendees if requested
        const filteredAttendees = filterEmpty
            ? attendees.filter(a => a.name && a.email)
            : attendees

        // Transform data for export
        const exportData = filteredAttendees.map(attendee => ({
            'Name': attendee.name,
            'Email': attendee.email,
            'Type': attendee.type === 'ticket' ? 'Paid Ticket' : 'Free RSVP',
            'Event': attendee.eventTitle,
            'Event Date': this.formatDate(attendee.eventStartTime, dateFormat),
            'Event Location': attendee.eventLocation || 'Not specified',
            'Status': attendee.status,
            'Ticket Type': attendee.ticketType,
            'Ticket Price': attendee.ticketPrice > 0 ? this.formatCurrency(attendee.ticketPrice, currencyFormat) : 'Free',
            'Registration Date': this.formatDate(attendee.createdAt, dateFormat),
            'Check-in Status': attendee.checkedInAt ? 'Checked In' : 'Not Checked In',
            'Check-in Time': attendee.checkedInAt ? this.formatDate(attendee.checkedInAt, dateFormat) : '',
            'Confirmation Code': attendee.confirmationCode || '',
            'Order ID': attendee.orderId || '',
            'Order Total': attendee.orderTotal ? this.formatCurrency(attendee.orderTotal, currencyFormat) : '',
            'Order Status': attendee.orderStatus || '',
            'Attendee Count': attendee.attendeeCount,
            'User ID': attendee.userId || '',
            'Event ID': attendee.eventId
        }))

        // Use custom fields if provided
        const headers = customFields || Object.keys(exportData[0] || {})

        const csvContent = this.generateCSVContent(exportData, headers)
        this.downloadCSV(csvContent, filename)
    }

    async exportAnalytics(
        analyticsData: AnalyticsExportData[],
        options: CSVExportOptions = {}
    ): Promise<void> {
        const {
            filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`,
            dateFormat = 'short',
            currencyFormat = 'usd'
        } = options

        const exportData = analyticsData.map(event => ({
            'Event ID': event.eventId,
            'Event Title': event.eventTitle,
            'Event Date': this.formatDate(event.eventDate, dateFormat),
            'Total Attendees': event.totalAttendees,
            'Total Revenue': this.formatCurrency(event.totalRevenue * 100, currencyFormat),
            'Capacity': event.capacity,
            'Capacity Utilization': `${event.conversionRate.toFixed(1)}%`,
            'RSVP Count': event.rsvpCount,
            'Ticket Count': event.ticketCount,
            'Check-in Rate': `${event.checkInRate.toFixed(1)}%`,
            'Revenue Per Attendee': event.totalAttendees > 0
                ? this.formatCurrency((event.totalRevenue * 100) / event.totalAttendees, currencyFormat)
                : '$0.00'
        }))

        const headers = Object.keys(exportData[0] || {})
        const csvContent = this.generateCSVContent(exportData, headers)
        this.downloadCSV(csvContent, filename)
    }

    async exportEvents(
        events: EventExportData[],
        options: CSVExportOptions = {}
    ): Promise<void> {
        const {
            filename = `events-export-${new Date().toISOString().split('T')[0]}.csv`,
            dateFormat = 'short',
            currencyFormat = 'usd'
        } = options

        const exportData = events.map(event => ({
            'Event ID': event.id,
            'Title': event.title,
            'Description': event.description.replace(/\n/g, ' ').substring(0, 100) + '...',
            'Start Time': this.formatDate(event.startTime, dateFormat),
            'End Time': this.formatDate(event.endTime, dateFormat),
            'Location': event.location || 'Not specified',
            'Capacity': event.capacity,
            'Status': event.status,
            'Published': event.published ? 'Yes' : 'No',
            'Created Date': this.formatDate(event.createdAt, dateFormat),
            'Total Attendees': event.totalAttendees,
            'Total Revenue': this.formatCurrency(event.totalRevenue, currencyFormat),
            'Ticket Types': event.ticketTypes,
            'Capacity Utilization': event.capacity > 0
                ? `${((event.totalAttendees / event.capacity) * 100).toFixed(1)}%`
                : 'N/A'
        }))

        const headers = Object.keys(exportData[0] || {})
        const csvContent = this.generateCSVContent(exportData, headers)
        this.downloadCSV(csvContent, filename)
    }

    // Export summary data from analytics overview
    async exportSummary(
        overviewData: Record<string, unknown>,
        timeRange: string,
        options: CSVExportOptions = {}
    ): Promise<void> {
        const {
            filename = `summary-export-${new Date().toISOString().split('T')[0]}.csv`,
            currencyFormat = 'usd'
        } = options

        const exportData = [{
            'Report Date': new Date().toLocaleDateString('en-US'),
            'Time Range': timeRange,
            'Total Events': overviewData.totalEvents,
            'Total Attendees': overviewData.totalAttendees,
            'Total Revenue': this.formatCurrency((overviewData.totalRevenue as number || 0) * 100, currencyFormat),
            'Average Attendance': (overviewData.averageAttendance as number || 0).toFixed(1),
            'Conversion Rate': `${(overviewData.conversionRate as number || 0).toFixed(1)}%`,
            'Growth Rate': `${(overviewData.growthRate as number || 0).toFixed(1)}%`
        }]

        const headers = Object.keys(exportData[0])
        const csvContent = this.generateCSVContent(exportData, headers)
        this.downloadCSV(csvContent, filename)
    }
}

// Export singleton instance
export const csvExporter = new CSVExporter()

// Helper function to transform attendees API response to export format
export function transformAttendeesForExport(attendees: Record<string, unknown>[]): AttendeeExportData[] {
    return attendees.map(attendee => ({
        id: attendee.id as string,
        type: attendee.type as 'ticket' | 'rsvp',
        name: attendee.name as string,
        email: attendee.email as string,
        eventId: attendee.eventId as string,
        eventTitle: attendee.eventTitle as string,
        eventStartTime: attendee.eventStartTime as string,
        eventLocation: attendee.eventLocation as string,
        status: attendee.status as string,
        checkedInAt: attendee.checkedInAt as string | null,
        createdAt: attendee.createdAt as string,
        ticketType: attendee.ticketType as string,
        ticketPrice: attendee.ticketPrice as number,
        confirmationCode: attendee.confirmationCode as string | null,
        orderId: attendee.orderId as string | null,
        orderTotal: attendee.orderTotal as number | null,
        orderStatus: attendee.orderStatus as string | null,
        userId: attendee.userId as string | null,
        attendeeCount: attendee.attendeeCount as number
    }))
} 