'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { FilterOption } from '@/lib/types/filters';

interface CategoryFilterProps {
    selectedCategories: string[];
    availableCategories: FilterOption[];
    onChange: (categories: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function CategoryFilter({
    selectedCategories,
    availableCategories,
    onChange,
    placeholder = 'Select categories...',
    className = ''
}: CategoryFilterProps) {
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

    const handleCategoryToggle = (categoryValue: string) => {
        const newCategories = selectedCategories.includes(categoryValue)
            ? selectedCategories.filter(c => c !== categoryValue)
            : [...selectedCategories, categoryValue];

        onChange(newCategories);
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const getDisplayText = () => {
        if (selectedCategories.length === 0) return placeholder;
        if (selectedCategories.length === 1) {
            const category = availableCategories.find(c => c.value === selectedCategories[0]);
            return category?.label || selectedCategories[0];
        }
        return `${selectedCategories.length} categories selected`;
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Main Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className={`truncate ${selectedCategories.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                    {getDisplayText()}
                </span>
                <div className="flex items-center gap-1">
                    {selectedCategories.length > 0 && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="p-0.5 hover:bg-gray-100 rounded"
                            aria-label="Clear selection"
                        >
                            <X className="w-3 h-3 text-gray-400" />
                        </button>
                    )}
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {availableCategories.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                            No categories available
                        </div>
                    ) : (
                        <div className="py-1">
                            {availableCategories.map((category) => {
                                const isSelected = selectedCategories.includes(category.value);
                                return (
                                    <button
                                        key={category.value}
                                        type="button"
                                        onClick={() => handleCategoryToggle(category.value)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-300'
                                                }`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                            <span className="text-gray-900">{category.label}</span>
                                        </div>
                                        {category.count !== undefined && (
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {category.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 