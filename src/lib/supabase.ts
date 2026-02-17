import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://wsbtgnfembwffsshughi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzYnRnbmZlbWJ3ZmZzc2h1Z2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2Mzc2MjMsImV4cCI6MjA4NDIxMzYyM30.49iG3vK6VcJg6676L6cx7055PP4UFSWfY9gcgJLp5zs"
);
