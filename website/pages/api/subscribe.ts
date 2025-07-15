import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, source } = req.body;

        // Simple validation
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email address' });
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
                return res.status(409).json({
                    success: false,
                    message: 'Email already subscribed'
                });
            }

            throw error;
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Subscription successful'
        });
    } catch (error) {
        console.error('[SUBSCRIPTION] Error processing subscription:', error);
        return res.status(500).json({
            error: 'Failed to process subscription'
        });
    }
}