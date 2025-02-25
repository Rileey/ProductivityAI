-- Add due_time column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN due_time TIME WITH TIME ZONE;

-- Update existing rows (optional)
UPDATE public.tasks 
SET due_time = NULL 
WHERE due_time IS NULL; 