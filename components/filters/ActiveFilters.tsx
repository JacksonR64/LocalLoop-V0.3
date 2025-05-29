'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ActiveFilter } from '@/lib/types/filters';

interface ActiveFiltersProps {
    activeFilters: ActiveFilter[];
    onClearAll?: () => void;
    className?: string;
}

export function ActiveFilters({ activeFilters, onClearAll, className = '' }: ActiveFiltersProps) {
    if (activeFilters.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                    Active filters ({activeFilters.length})
                </span>
                {onClearAll && activeFilters.length > 1 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                    <FilterChip
                        key={`${filter.type}-${filter.value}-${index}`}
                        filter={filter}
                    />
                ))}
            </div>
        </div>
    );
}

interface FilterChipProps {
    filter: ActiveFilter;
}

function FilterChip({ filter }: FilterChipProps) {
    const getChipColor = (type: ActiveFilter['type']): string => {
        switch (type) {
            case 'category':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'dateRange':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'priceType':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'searchQuery':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${getChipColor(filter.type)}`}
        >
            <span className="font-medium">{filter.label}</span>
            <button
                onClick={filter.removeFilter}
                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 focus:outline-none focus:bg-black/10"
                aria-label={`Remove ${filter.label} filter`}
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
} 