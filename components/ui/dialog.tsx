import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

interface DialogContentProps {
    children: React.ReactNode;
    className?: string;
}

interface DialogHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface DialogTitleProps {
    children: React.ReactNode;
    className?: string;
}

interface DialogDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

interface DialogFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="relative">
                {/* Close button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute -top-2 -right-2 bg-white hover:bg-gray-100 text-gray-900 p-1 rounded-full shadow-lg transition-all duration-200 z-10"
                    aria-label="Close dialog"
                >
                    <X className="w-4 h-4" />
                </button>
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
    return (
        <div className={`bg-white rounded-lg shadow-xl max-w-md max-h-[90vh] overflow-y-auto ${className}`}>
            {children}
        </div>
    );
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
    return (
        <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
            {children}
        </div>
    );
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
    return (
        <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
            {children}
        </h2>
    );
}

export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
    return (
        <p className={`text-sm text-gray-600 mt-1 ${className}`}>
            {children}
        </p>
    );
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
    return (
        <div className={`px-6 py-4 border-t border-gray-200 flex justify-end ${className}`}>
            {children}
        </div>
    );
} 