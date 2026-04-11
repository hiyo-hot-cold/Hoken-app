import { createClient } from '@supabase/supabase-js';

// .env.localから住所と鍵を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 「export」をつけることで、他のファイル（page.tsx）から使えるようになるよ！
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
