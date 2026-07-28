import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ytanvpjxqfdxcvghmzny.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HSPcuBxHV5KSmr0Pb-CQjQ_ORmvr90l';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
