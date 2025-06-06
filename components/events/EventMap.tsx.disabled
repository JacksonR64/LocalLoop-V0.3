'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, ExternalLink } from 'lucide-react';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);

const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);

const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);

const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

// Fix Leaflet marker icon paths
let DefaultIcon: typeof import('leaflet').Icon.Default | undefined;

if (typeof window !== 'undefined') {
    // Use dynamic import instead of require
    import('leaflet').then((leaflet) => {
        DefaultIcon = leaflet.Icon.Default;

        // Configure marker icons to use CDN instead of local paths
        DefaultIcon.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
    });
}

interface EventMapProps {
    location: string;
    eventTitle: string;
    className?: string;
}

interface Coordinates {
    lat: number;
    lng: number;
}

export function EventMap({ location, eventTitle, className = '' }: EventMapProps) {
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Mock geocoding - in a real app, you'd use a geocoding service
    useEffect(() => {
        const geocodeLocation = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Mock coordinates for demo - in production, use actual geocoding
                // For "Downtown Community Square, 123 Main Street"
                const mockCoordinates = {
                    lat: 37.7749,
                    lng: -122.4194
                };

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                setCoordinates(mockCoordinates);
            } catch (err) {
                setError('Unable to load map location');
                console.error('Geocoding error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        geocodeLocation();
    }, [location]);

    // Handle client-side map initialization
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMapReady(true);
        }
    }, []);

    const handleGetDirections = () => {
        if (coordinates) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
            window.open(url, '_blank');
        }
    };

    if (isLoading) {
        return (
            <div className={`bg-gray-100 rounded-lg h-48 flex items-center justify-center ${className}`}>
                <div className="text-center text-gray-500">
                    <MapPin className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                    <div className="text-sm">Loading map...</div>
                </div>
            </div>
        );
    }

    if (error || !coordinates) {
        return (
            <div className={`bg-gray-100 rounded-lg h-48 flex items-center justify-center ${className}`}>
                <div className="text-center text-gray-500">
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <div className="text-sm">{error || 'Map unavailable'}</div>
                    <button
                        onClick={handleGetDirections}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mx-auto"
                    >
                        Open in Maps <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    }

    if (!isMapReady) {
        return (
            <div className={`bg-gray-100 rounded-lg h-48 flex items-center justify-center ${className}`}>
                <div className="text-center text-gray-500">
                    <MapPin className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm">Preparing map...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-lg overflow-hidden ${className}`}>
            <div className="h-48 w-full">
                <MapContainer
                    center={[coordinates.lat, coordinates.lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-lg"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[coordinates.lat, coordinates.lng]}>
                        <Popup>
                            <div className="text-center">
                                <div className="font-medium text-gray-900 mb-1">{eventTitle}</div>
                                <div className="text-sm text-gray-600 mb-2">{location}</div>
                                <button
                                    onClick={handleGetDirections}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                >
                                    Get Directions <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>

            {/* Get Directions Button Overlay */}
            <div className="absolute bottom-2 right-2">
                <button
                    onClick={handleGetDirections}
                    className="bg-white shadow-lg hover:shadow-xl border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 transition-all flex items-center gap-2"
                >
                    <MapPin className="w-4 h-4" />
                    Directions
                </button>
            </div>
        </div>
    );
} 