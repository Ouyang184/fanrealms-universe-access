ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_digital_products_project_id
  ON public.digital_products(project_id);