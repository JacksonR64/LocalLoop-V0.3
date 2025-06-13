import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                    <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">Privacy Policy</h1>
                    <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        Your privacy is important to us. Here&apos;s how we protect and use your information.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="bg-white rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
                        <div className="space-y-4 text-gray-600">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
                                <p>When you create an account, we collect your name, email address, and profile information to provide you with personalized event recommendations.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Event Data</h3>
                                <p>We collect information about events you create, attend, or show interest in to improve our service and provide relevant suggestions.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Usage Information</h3>
                                <p>We automatically collect information about how you use LocalLoop, including pages visited and features used, to enhance user experience.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                <span>Provide and improve our event discovery and management services</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                <span>Send you notifications about events you&apos;re interested in or attending</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                <span>Connect you with other community members and event organizers</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                <span>Analyze usage patterns to improve our platform and features</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                <span>Comply with legal obligations and protect against harmful activities</span>
                            </li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
                        <div className="space-y-4 text-gray-600">
                            <p>We do not sell your personal information. We may share your information only in these limited circumstances:</p>
                            <ul className="space-y-2 pl-4">
                                <li>• With event organizers when you RSVP or purchase tickets</li>
                                <li>• With service providers who help us operate our platform</li>
                                <li>• When required by law or to protect safety and security</li>
                                <li>• With your consent for specific purposes</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-white rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>
                        <div className="space-y-4 text-gray-600">
                            <p>You have control over your information:</p>
                            <ul className="space-y-2 pl-4">
                                <li>• Access and update your account information at any time</li>
                                <li>• Delete your account and associated data</li>
                                <li>• Opt out of non-essential communications</li>
                                <li>• Request a copy of your data</li>
                                <li>• Control your privacy settings and visibility</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-white rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security</h2>
                        <p className="text-gray-600">
                            We implement industry-standard security measures to protect your information, including encryption,
                            secure servers, and regular security audits. However, no online service can guarantee 100% security.
                        </p>
                    </section>

                    <section className="bg-white rounded-lg shadow-sm border p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
                        <p className="text-gray-600">
                            We may update this privacy policy from time to time. We&apos;ll notify you of significant changes
                            via email or through the platform. Continued use of LocalLoop after changes constitutes acceptance.
                        </p>
                    </section>
                </div>

                <div className="text-center mt-12 bg-white rounded-lg shadow-sm border p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Questions?</h3>
                    <p className="text-gray-600 mb-6">
                        If you have questions about this privacy policy or how we handle your information, please contact us.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Contact Us
                        </Link>
                        <Link
                            href="/"
                            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Back to Events
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
} 