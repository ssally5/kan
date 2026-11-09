import {
  SUPABASE_URL,
  SUPABASE_KEY
} from './supabase-config.js';

export async function searchDictionary(query, mode = 'Auto') {
  const q = query.trim();
  if (!q) return [];

  const url = SUPABASE_URL.trim().replace(/\/$/, '');
  const key = SUPABASE_KEY.trim();

  if (!url || url.includes('PASTE_')) {
    throw new Error('Supabase project URL is missing.');
  }

  if (!key || key.includes('PASTE_')) {
    throw new Error('Supabase publishable key is missing.');
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error(
      'Invalid Supabase URL format. Check the Project URL in Supabase settings.'
    );
  }

  const response = await fetch(
    `${url}/rest/v1/rpc/kan_search_dictionary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key
      },
      body: JSON.stringify({
        search_term: q,
        search_mode: mode,
        max_results: 30
      })
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Dictionary request failed (${response.status}): ${details.slice(0, 250)}`
    );
  }

  return await response.json();
}