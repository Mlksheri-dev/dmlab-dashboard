-- Add cpu_uptime column to lab_pcs table for storing uptime in minutes
ALTER TABLE public.lab_pcs ADD COLUMN cpu_uptime integer NOT NULL DEFAULT 0;