ALTER TABLE public.bundle_items
  ADD CONSTRAINT bundle_items_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.bundles
  ADD CONSTRAINT bundles_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;