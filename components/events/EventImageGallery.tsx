'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn, Download, Share2 } from 'lucide-react';

export interface EventImage {
    url: string;
    alt: string;
    caption?: string;
    isMain?: boolean;
}

interface EventImageGalleryProps {
    images: EventImage[];
    eventTitle: string;
    className?: string;
}

export function EventImageGallery({ images, eventTitle, className = '' }: EventImageGalleryProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});

    const mainImage = images.find(img => img.isMain) || images[0];
    const thumbnailImages = images.slice(0, 5); // Show first 5 images in gallery
    const hasMoreImages = images.length > 5;

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
    }, []);

    const navigateImage = useCallback((direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
        } else {
            setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
        }
    }, [images.length]);

    // Keyboard navigation effect
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (!isLightboxOpen) return;

            switch (event.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    navigateImage('prev');
                    break;
                case 'ArrowRight':
                    navigateImage('next');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isLightboxOpen, navigateImage, closeLightbox]);

    const handleImageLoad = (index: number) => {
        setIsLoading(prev => ({ ...prev, [index]: false }));
    };

    const handleImageLoadStart = (index: number) => {
        setIsLoading(prev => ({ ...prev, [index]: true }));
    };

    const downloadImage = async (imageUrl: string, fileName: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const shareImage = async (imageUrl: string) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: eventTitle,
                    text: `Check out this image from ${eventTitle}`,
                    url: imageUrl
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(imageUrl);
        }
    };

    if (!images || images.length === 0) {
        return (
            <div className={`relative h-64 sm:h-80 lg:h-96 bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
                <div className="text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-sm">No images available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Main Image */}
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden group cursor-pointer">
                <Image
                    src={mainImage.url}
                    alt={mainImage.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    onLoadingComplete={() => handleImageLoad(0)}
                    onLoadStart={() => handleImageLoadStart(0)}
                />

                {/* Image overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                        <button
                            onClick={() => openLightbox(0)}
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-2 rounded-full transition-all duration-200"
                            aria-label="View full size image"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => shareImage(mainImage.url)}
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-2 rounded-full transition-all duration-200"
                            aria-label="Share image"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => downloadImage(mainImage.url, `${eventTitle}-image.jpg`)}
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-2 rounded-full transition-all duration-200"
                            aria-label="Download image"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Loading indicator */}
                {isLoading[0] && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                )}

                {/* Image count badge */}
                {images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm">
                        1 / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
                <div className="mt-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {thumbnailImages.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => openLightbox(index)}
                                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
                                aria-label={`View image ${index + 1}`}
                            >
                                <Image
                                    src={image.url}
                                    alt={image.alt}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                    onLoadingComplete={() => handleImageLoad(index)}
                                    onLoadStart={() => handleImageLoadStart(index)}
                                />
                                {isLoading[index] && (
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                )}
                            </button>
                        ))}

                        {/* More images indicator */}
                        {hasMoreImages && (
                            <button
                                onClick={() => openLightbox(5)}
                                className="relative flex-shrink-0 w-20 h-20 rounded-lg bg-gray-900 bg-opacity-80 flex items-center justify-center text-white text-sm font-medium hover:bg-opacity-90 transition-all duration-200"
                                aria-label={`View ${images.length - 5} more images`}
                            >
                                +{images.length - 5}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 z-10"
                        aria-label="Close lightbox"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Navigation buttons */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => navigateImage('prev')}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 z-10"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => navigateImage('next')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 z-10"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Image counter */}
                    <div className="absolute top-4 left-4 bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm z-10">
                        {selectedImageIndex + 1} / {images.length}
                    </div>

                    {/* Actions */}
                    <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
                        <button
                            onClick={() => shareImage(images[selectedImageIndex].url)}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
                            aria-label="Share image"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => downloadImage(images[selectedImageIndex].url, `${eventTitle}-image-${selectedImageIndex + 1}.jpg`)}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
                            aria-label="Download image"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main lightbox image */}
                    <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
                        <Image
                            src={images[selectedImageIndex].url}
                            alt={images[selectedImageIndex].alt}
                            width={1200}
                            height={800}
                            className="max-w-full max-h-full object-contain"
                            priority
                        />
                    </div>

                    {/* Image caption */}
                    {images[selectedImageIndex].caption && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-20 text-white p-3 rounded-lg text-center z-10">
                            <p className="text-sm">{images[selectedImageIndex].caption}</p>
                        </div>
                    )}

                    {/* Keyboard navigation hint */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-70 z-10">
                        Use arrow keys to navigate • ESC to close
                    </div>
                </div>
            )}
        </div>
    );
} 