import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY || "";

if (!supabaseUrl) {
  console.warn("⚠️ SUPABASE_URL is not set in environment config.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
