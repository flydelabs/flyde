import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
    try {
        const { email, source } = await request.json();

        // Simple validation
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Log the email to console
        console.log(`[SUBSCRIPTION] New email subscription: ${email} (source: ${source || 'unknown'})`);

        // Store the email in Supabase
        const { error } = await supabase
            .from('subscriptions')
            .insert([
                {
                    email,
                    source: source || 'unknown',
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error('[SUBSCRIPTION] Supabase error:', error);

            // Check for duplicate email (unique constraint violation)
            if (error.code === '23505') {
                return NextResponse.json(
                    { success: false, message: 'Email already subscribed' },
                    { status: 409 }
                );
            }

            throw error;
        }

        // Return success response
        return NextResponse.json(
            { success: true, message: 'Subscription successful' },
            { status: 200 }
        );
    } catch (error) {
        console.error('[SUBSCRIPTION] Error processing subscription:', error);
        return NextResponse.json(
            { error: 'Failed to process subscription' },
            { status: 500 }
        );
    }
} 