CREATE TABLE public.skin_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled skin',
  skin_png TEXT NOT NULL,
  reference_data_url TEXT,
  palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan JSONB,
  view_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skin_projects TO authenticated;
GRANT ALL ON public.skin_projects TO service_role;

ALTER TABLE public.skin_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own skin projects"
ON public.skin_projects FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX skin_projects_user_updated_idx ON public.skin_projects (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER skin_projects_set_updated_at
BEFORE UPDATE ON public.skin_projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();