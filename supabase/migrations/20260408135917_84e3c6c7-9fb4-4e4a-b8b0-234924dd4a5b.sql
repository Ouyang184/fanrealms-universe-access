-- Projects table for the indie marketplace showcase
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  tags text[] DEFAULT '{}'::text[],
  cover_image_url text,
  website_url text,
  repository_url text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(creator_id, slug)
);

-- Devlogs table for project updates
CREATE TABLE public.devlogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devlogs ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Public can view published projects"
  ON public.projects FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can manage their own projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid()))
  WITH CHECK (creator_id IN (SELECT c.id FROM creators c WHERE c.user_id = auth.uid()));

-- Devlogs RLS policies
CREATE POLICY "Public can view published devlogs on published projects"
  ON public.devlogs FOR SELECT
  USING (
    status = 'published' AND
    project_id IN (SELECT p.id FROM projects p WHERE p.status = 'published')
  );

CREATE POLICY "Authors can view their own devlogs"
  ON public.devlogs FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Creators can manage devlogs on their projects"
  ON public.devlogs FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (
    author_id = auth.uid() AND
    project_id IN (
      SELECT p.id FROM projects p
      JOIN creators c ON c.id = p.creator_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_projects_creator_id ON public.projects(creator_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_devlogs_project_id ON public.devlogs(project_id);
CREATE INDEX idx_devlogs_author_id ON public.devlogs(author_id);
CREATE INDEX idx_devlogs_created_at ON public.devlogs(created_at DESC);