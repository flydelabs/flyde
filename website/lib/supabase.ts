import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfvvslzvfkyaoyngcjti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnZzbHp2Zmt5YW95bmdjanRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIyNzQwMTMsImV4cCI6MjAwNzg1MDAxM30.uHeNTszUuSPDX-j4ZZnFcU8nJroqJv6bSk78zAhFB-Q';

export const supabase = createClient(supabaseUrl, supabaseKey); 