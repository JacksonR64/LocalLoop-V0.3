import Link from 'next/link';
import { Calendar, ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">LocalLoop</h1>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        We&apos;d love to hear from you! Get in touch with our team.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Methods */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Mail className="w-6 h-6 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
                            </div>
                            <p className="text-gray-600 mb-3">
                                For general inquiries and support questions.
                            </p>
                            <p className="text-blue-600 font-medium">support@localloop.com</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <MessageCircle className="w-6 h-6 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Community Support</h3>
                            </div>
                            <p className="text-gray-600 mb-3">
                                Connect with other LocalLoop users and get help from the community.
                            </p>
                            <p className="text-gray-500">Coming Soon</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Phone className="w-6 h-6 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Phone Support</h3>
                            </div>
                            <p className="text-gray-600 mb-3">
                                For urgent issues and enterprise customers.
                            </p>
                            <p className="text-gray-500">Available with premium plans</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send us a Message</h3>
                        <form className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject
                                </label>
                                <select
                                    id="subject"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a topic</option>
                                    <option value="support">Technical Support</option>
                                    <option value="billing">Billing Question</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tell us how we can help..."
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <p className="text-gray-600 mb-4">
                        Looking for something else? Check out our other resources:
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/about"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            About Us
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
} 