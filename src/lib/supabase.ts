// Local API endpoint. Kept in this file to preserve app structure.
const DEFAULT_API_BASE = "http://localhost:8000/make-server-cfb78916";

export const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;

// Backward-compatible placeholder: the project no longer uses Supabase remote runtime.
export const getSupabase = () => {
  throw new Error(
    "Supabase distant est désactivé. Utilisez API_BASE pour les appels backend locaux.",
  );
};

export const supabase = new Proxy({} as any, {
  get: () => {
    throw new Error(
      "Supabase distant est désactivé. Utilisez API_BASE pour les appels backend locaux.",
    );
  },
});