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
    const [showTooltip, setShowTooltip] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

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

    // Get current sort option details
    const getCurrentOption = () => {
        return SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0];
    };

    // Handle sort option selection
    const handleSortSelect = (sortOption: SortOption) => {
        onSortChange(sortOption);
        setIsOpen(false);
    };

    const currentOption = getCurrentOption();

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Tooltip */}
            {showTooltip && !isOpen && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-50">
                    {currentOption.tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}

            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={`Sort events: ${currentOption.tooltip}`}
                title={currentOption.tooltip}
            >
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 whitespace-nowrap">
                        {currentOption.label}
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
                                    title={option.tooltip}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-gray-500">{option.tooltip}</div>
                                        </div>
                                        {isSelected && (
                                            <span className="text-blue-600">✓</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
} 