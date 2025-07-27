import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { uniqueNamesGenerator, adjectives, animals, NumberDictionary } from 'unique-names-generator';

const numberDictionary = NumberDictionary.generate({ min: 1, max: 999 });

async function generateUniqueSlug(): Promise<string> {
  let slug = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, numberDictionary],
    separator: '-',
    length: 3,
    style: 'lowerCase'
  });
  
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('flows')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (!existing) {
      return slug;
    }

    slug = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, numberDictionary],
      separator: '-',
      length: 3,
      style: 'lowerCase'
    });
    attempts++;
  }

  // Fallback to random string if we can't find a unique slug
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let fallback = '';
  for (let i = 0; i < 8; i++) {
    fallback += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, description, content, forkedFromSlug } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const slug = await generateUniqueSlug();

    const { data, error } = await supabase
      .from('flows')
      .insert({
        slug,
        title,
        description,
        content,
        forked_from_slug: forkedFromSlug
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save flow' });
    }

    res.status(201).json({ slug: data.slug });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}