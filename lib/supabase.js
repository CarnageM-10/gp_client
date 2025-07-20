// supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lkaleayicdacgsnqxzex.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYWxlYXlpY2RhY2dzbnF4emV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Njk4NzksImV4cCI6MjA2NTE0NTg3OX0.TG3uZrgCyaugaEweACxAcS3l7Hzc9slu4EDFdOi6p0o'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
