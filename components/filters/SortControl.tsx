'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { SortOption, SORT_OPTIONS } from '@/lib/types/filters';

interface SortControlProps {
    sortBy: SortOption;
    onSortChange: (sortOption: SortOption) => void;
    className?: string;
}

export function SortControl({ sortBy, onSortChange, className = '' }: SortControlProps) {
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
        const option = SORT_OPTIONS.find(opt => opt.value === sortBy);
        return option?.label || 'Date (Earliest First)';
    };

    // Handle sort option selection
    const handleSortSelect = (sortOption: SortOption) => {
        onSortChange(sortOption);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label="Sort events"
            >
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                        {getDisplayText()}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="py-1">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                            Sort by
                        </div>
                        {SORT_OPTIONS.map((option) => {
                            const isSelected = sortBy === option.value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSortSelect(option.value)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                                        }`}
                                >
                                    {option.label}
                                    {isSelected && (
                                        <span className="float-right text-blue-600">✓</span>
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