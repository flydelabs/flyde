import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfvvslzvfkyaoyngcjti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnZzbHp2Zmt5YW95bmdjanRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIyNzQwMTMsImV4cCI6MjAwNzg1MDAxM30.uHeNTszUuSPDX-j4ZZnFcU8nJroqJv6bSk78zAhFB-Q';

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for server-side operations (add your service role key here)
// You can find this in Supabase Dashboard → Settings → API
export const supabaseAdmin = createClient(
  supabaseUrl, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey // fallback to anon key if service key not set
); 