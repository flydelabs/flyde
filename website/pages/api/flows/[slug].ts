import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Valid slug is required' });
  }

  try {
    // Use the Supabase function that handles both fetching and incrementing view count
    const { data, error } = await supabase
      .rpc('get_flow_by_slug', { input_slug: slug }).select().single();

    if (error) {
      console.error('Function error:', error);
      return res.status(500).json({ error: 'Failed to fetch flow' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Flow not found' });
    }

  

    res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}