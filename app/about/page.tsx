import Link from 'next/link';
import { Heart, Users, MapPin } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-[var(--foreground)] mb-8">About LocalLoop</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Connecting communities through meaningful local events and experiences.
                </p>
            </div>

            <div className="space-y-12">
                {/* Mission */}
                <section className="bg-white rounded-lg shadow-sm border p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Heart className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold text-gray-900">Our Mission</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                        LocalLoop believes that strong communities are built through shared experiences.
                        We make it easy for people to discover, attend, and organize local events that
                        bring neighbors together, foster connections, and create lasting memories.
                    </p>
                </section>

                {/* Features */}
                <section className="bg-white rounded-lg shadow-sm border p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold text-gray-900">What We Offer</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Event Discovery</h3>
                            <p className="text-gray-600 text-sm">
                                Find local events that match your interests with our smart filtering and search tools.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Easy Organization</h3>
                            <p className="text-gray-600 text-sm">
                                Create and manage events with our intuitive tools, from simple gatherings to ticketed experiences.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Calendar Integration</h3>
                            <p className="text-gray-600 text-sm">
                                Seamlessly sync events with Google Calendar and never miss what matters to you.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Community Building</h3>
                            <p className="text-gray-600 text-sm">
                                Connect with like-minded neighbors and build lasting relationships through shared activities.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="bg-white rounded-lg shadow-sm border p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <MapPin className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold text-gray-900">Our Values</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Community First</h3>
                            <p className="text-gray-600 text-sm">
                                Every feature we build is designed to strengthen local communities and foster genuine connections.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Accessibility & Inclusion</h3>
                            <p className="text-gray-600 text-sm">
                                We believe everyone should have access to community events, regardless of background or ability.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Privacy & Safety</h3>
                            <p className="text-gray-600 text-sm">
                                Your data and safety are our top priorities. We&apos;re committed to transparent, ethical practices.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="text-center mt-12">
                <Link
                    href="/"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Start Exploring Events
                </Link>
            </div>
        </div>
    );
} 