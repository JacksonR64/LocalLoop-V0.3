import Link from 'next/link';
import { Calendar, ArrowLeft, User } from 'lucide-react';

export default function MyEventsPage() {
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
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">My Events</h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Manage your events, RSVPs, and tickets all in one place. Sign in to get started!
                    </p>

                    <div className="bg-white rounded-lg shadow-sm border p-8 max-w-lg mx-auto">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">What You&apos;ll See Here:</h2>
                        <ul className="text-left space-y-3 text-gray-600">
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                Events you&apos;ve created
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                Events you&apos;ve RSVP&apos;d to
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                Tickets you&apos;ve purchased
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                Event management tools
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                Calendar sync status
                            </li>
                        </ul>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/login"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/"
                            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Browse Events
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
} 