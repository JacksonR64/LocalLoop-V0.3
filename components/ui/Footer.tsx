import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-gray-900 text-white mt-20" data-test-id="footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <Link href="/" className="flex items-center justify-center gap-3 mb-4" data-test-id="footer-logo">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-xl font-bold" data-test-id="footer-title">LocalLoop</h4>
                    </Link>
                    <p className="text-gray-400 mb-6" data-test-id="footer-description">
                        Connecting communities through local events
                    </p>
                    <div className="flex justify-center gap-6 text-sm" data-test-id="footer-links">
                        <Link href="/about" className="text-gray-400 hover:text-white" data-test-id="footer-about-link">About</Link>
                        <Link href="/privacy" className="text-gray-400 hover:text-white" data-test-id="footer-privacy-link">Privacy</Link>
                        <Link href="/terms" className="text-gray-400 hover:text-white" data-test-id="footer-terms-link">Terms</Link>
                        <Link href="/contact" className="text-gray-400 hover:text-white" data-test-id="footer-contact-link">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
} 