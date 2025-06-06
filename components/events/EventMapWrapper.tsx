'use client'

import { MapPin, ExternalLink } from 'lucide-react'

interface EventMapWrapperProps {
    location: string
    eventTitle: string
    className?: string
}

export function EventMapWrapper({ location, eventTitle, className }: EventMapWrapperProps) {
    // Create a Google Maps URL for the location
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

    return (
        <div className={`bg-gray-100 rounded-lg h-48 flex items-center justify-center ${className || ''}`}>
            <div className="text-center text-gray-700 p-6">
                <MapPin className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <div className="text-sm font-medium mb-2">{eventTitle}</div>
                <div className="text-xs text-gray-600 mb-3">{location}</div>
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                    <ExternalLink className="w-3 h-3" />
                    View on Google Maps
                </a>
            </div>
        </div>
    )
} 