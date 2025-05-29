'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DollarSign, ChevronDown } from 'lucide-react';
import { PriceFilterType, PRICE_FILTER_OPTIONS } from '@/lib/types/filters';

interface PriceFilterProps {
    selectedPrice: PriceFilterType;
    onPriceChange: (priceType: PriceFilterType) => void;
    eventCounts?: { free: number; paid: number; total: number };
    className?: string;
}

export function PriceFilter({
    selectedPrice,
    onPriceChange,
    eventCounts,
    className = ''
}: PriceFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get display text for current selection
    const getDisplayText = (): string => {
        const option = PRICE_FILTER_OPTIONS.find(opt => opt.value === selectedPrice);
        return option?.label || 'All Events';
    };

    // Get count for a price type
    const getCountForType = (priceType: PriceFilterType): number | undefined => {
        if (!eventCounts) return undefined;

        switch (priceType) {
            case 'all':
                return eventCounts.total;
            case 'free':
                return eventCounts.free;
            case 'paid':
                return eventCounts.paid;
            default:
                return undefined;
        }
    };

    // Handle option selection
    const handleOptionSelect = (priceType: PriceFilterType) => {
        onPriceChange(priceType);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                        {getDisplayText()}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="py-1">
                        {PRICE_FILTER_OPTIONS.map((option) => {
                            const count = getCountForType(option.value);
                            const isSelected = selectedPrice === option.value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleOptionSelect(option.value)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                                        }`}
                                >
                                    <span>{option.label}</span>
                                    {count !== undefined && (
                                        <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'
                                            }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
} 