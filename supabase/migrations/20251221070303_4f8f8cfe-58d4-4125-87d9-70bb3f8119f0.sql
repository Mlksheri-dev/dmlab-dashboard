-- Create table for individual storage disks per PC
CREATE TABLE public.pc_disks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pc_id UUID NOT NULL REFERENCES public.lab_pcs(id) ON DELETE CASCADE,
  disk_name TEXT NOT NULL,
  disk_label TEXT,
  total_gb INTEGER NOT NULL DEFAULT 0,
  used_gb INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pc_disks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view pc_disks" 
ON public.pc_disks 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert pc_disks" 
ON public.pc_disks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update pc_disks" 
ON public.pc_disks 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete pc_disks" 
ON public.pc_disks 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_pc_disks_updated_at
BEFORE UPDATE ON public.pc_disks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pc_disks;