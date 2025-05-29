'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { DateRange, DATE_RANGE_PRESETS } from '@/lib/types/filters';

interface DateFilterProps {
    selectedRange: DateRange | null;
    onRangeChange: (range: DateRange | null) => void;
    className?: string;
}

export function DateFilter({ selectedRange, onRangeChange, className = '' }: DateFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
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

    // Format date for display
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    // Get display text for current selection
    const getDisplayText = (): string => {
        if (!selectedRange) return 'Any date';

        // Check if it matches a preset
        const preset = DATE_RANGE_PRESETS.find(preset => {
            const presetRange = preset.getRange();
            return Math.abs(presetRange.start.getTime() - selectedRange.start.getTime()) < 1000 &&
                Math.abs(presetRange.end.getTime() - selectedRange.end.getTime()) < 1000;
        });

        if (preset) {
            return preset.label;
        }

        // Custom range
        return `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`;
    };

    // Handle preset selection
    const handlePresetSelect = (preset: typeof DATE_RANGE_PRESETS[0]) => {
        const range = preset.getRange();
        onRangeChange(range);
        setIsOpen(false);
    };

    // Handle custom date range
    const handleCustomRange = () => {
        if (!customStart || !customEnd) return;

        const startDate = new Date(customStart);
        const endDate = new Date(customEnd);

        // Ensure start is before end
        if (startDate > endDate) {
            return;
        }

        // Set proper time bounds
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        onRangeChange({ start: startDate, end: endDate });
        setIsOpen(false);
    };

    // Clear selection
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRangeChange(null);
        setCustomStart('');
        setCustomEnd('');
    };

    // Initialize custom date inputs with current selection
    useEffect(() => {
        if (selectedRange) {
            setCustomStart(selectedRange.start.toISOString().split('T')[0]);
            setCustomEnd(selectedRange.end.toISOString().split('T')[0]);
        }
    }, [selectedRange]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={selectedRange ? 'text-gray-900' : 'text-gray-500'}>
                        {getDisplayText()}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {selectedRange && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            aria-label="Clear date filter"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="py-1">
                        {/* Preset Options */}
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                            Quick Select
                        </div>
                        {DATE_RANGE_PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => handlePresetSelect(preset)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            >
                                {preset.label}
                            </button>
                        ))}

                        {/* Custom Date Range */}
                        <div className="border-t border-gray-100 pt-2">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Custom Range
                            </div>
                            <div className="px-3 pb-3 space-y-2">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        min={customStart}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={handleCustomRange}
                                    disabled={!customStart || !customEnd}
                                    className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Apply Range
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 