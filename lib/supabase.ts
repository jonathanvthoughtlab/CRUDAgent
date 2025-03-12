import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Todo {
  id: string;
  title: string;
  description?: string; // Descrição com formatação rica
  completed: boolean;
  user_id: string;
  image_url?: string;
  created_at: string;
  due_date?: string | null; // Data de vencimento pode ser null
}

export interface Profile {
  id: string;
  name?: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export type TodoInsert = Omit<Todo, 'id' | 'created_at'>; 