import type { NextApiRequest, NextApiResponse } from 'next';
import { PostHog } from 'posthog-node';

const posthog = new PostHog('phc_Sfg0m6OUVf32CH7J3tC0M9ikI3cWf1plqoPVO08OP82', {
  host: 'https://app.posthog.com',
  flushAt: 1,
  flushInterval: 1000,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { distinctId, event, properties } = req.body;

    if (!distinctId || !event) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    posthog.capture({
      distinctId,
      event,
      properties: properties || {}
    });

    await posthog.flush();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[TELEMETRY] Error:', error);
    return res.status(500).json({ error: 'Failed to process telemetry' });
  }
}