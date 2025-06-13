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
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-popover-foreground bg-popover border border-border rounded whitespace-nowrap z-50 shadow-md">
                    {currentOption.tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                </div>
            )}

            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm border border-input rounded-md bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={`Sort events: ${currentOption.tooltip}`}
                title={currentOption.tooltip}
            >
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground whitespace-nowrap">
                        {currentOption.label}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
                    <div className="py-1">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                            Sort by
                        </div>
                        {SORT_OPTIONS.map((option) => {
                            const isSelected = sortBy === option.value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSortSelect(option.value)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none ${isSelected ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-foreground'
                                        }`}
                                    title={option.tooltip}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-muted-foreground">{option.tooltip}</div>
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