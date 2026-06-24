// =============================================================================
// Autor Builders — Supabase Client
// src/lib/supabase.ts
// =============================================================================
// Single shared client instance. Import { supabase } wherever you need DB access.
//
// NOTE: The Database generic is intentionally omitted here.
// Our service layer uses its own strongly-typed DbXxx types from
// database.types.ts for all insert/update payloads. Passing the Database
// generic to createClient causes Supabase's internal TablesInsert<T> to
// conflict with our custom types, producing "not assignable to never[]" errors.
// Re-add the generic once you run `supabase gen types typescript` and replace
// database.types.ts with the auto-generated output.
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
  },
});