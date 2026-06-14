ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS engine TEXT;
UPDATE public.digital_products SET engine = 'Godot' WHERE engine IS NULL;