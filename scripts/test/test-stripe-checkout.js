// Test script to verify Stripe checkout functionality
// Run with: node test-stripe-checkout.js
// Make sure to have STRIPE_SECRET_KEY set in your environment

async function testStripeCheckout() {
    try {
        console.log('Testing Stripe Checkout Configuration...\n');
        
        // Check environment variables
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        
        if (!stripeSecretKey) {
            console.error('❌ STRIPE_SECRET_KEY is not configured');
            console.error('   Please set the environment variable before running this test');
            return;
        }
        
        console.log('✅ Stripe secret key is configured');
        console.log('   Secret key starts with:', stripeSecretKey.substring(0, 20) + '...\n');
        
        // Test Stripe connection
        const Stripe = require('stripe');
        const stripe = new Stripe(stripeSecretKey);
        
        // Test creating a simple PaymentIntent
        const testPaymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // $10.00
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            confirmation_method: 'automatic',
            metadata: {
                test: 'true',
                event_id: 'test-event',
            },
        });
        
        console.log('✅ Stripe connection successful');
        console.log('   Test PaymentIntent created:', testPaymentIntent.id);
        console.log('   Status:', testPaymentIntent.status);
        console.log('   Client secret exists:', !!testPaymentIntent.client_secret);
        
        // Clean up test PaymentIntent
        await stripe.paymentIntents.cancel(testPaymentIntent.id);
        console.log('✅ Test PaymentIntent cleaned up\n');
        
        console.log('🎉 Stripe configuration is working correctly!');
        console.log('\nIMPORTANT: The return_url issue you\'re experiencing is likely due to:');
        console.log('1. Client-side environment where window.location.origin is not available');
        console.log('2. Payment methods that always require return_url (like bank redirects)');
        console.log('3. Browser environment restrictions\n');
        console.log('The fixes applied should resolve this by:');
        console.log('- Adding proper fallback URLs for server-side rendering');
        console.log('- Ensuring return_url is always provided during confirmation');
        console.log('- Adding better error logging for debugging');
        
    } catch (error) {
        console.error('❌ Error testing Stripe configuration:', error.message);
        if (error.type) {
            console.error('   Error type:', error.type);
        }
        if (error.code) {
            console.error('   Error code:', error.code);
        }
    }
}

testStripeCheckout(); 