ALTER TABLE public.gallery_skins ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.skin_projects(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS gallery_skins_project_id_key ON public.gallery_skins(project_id) WHERE project_id IS NOT NULL;

CREATE POLICY "Owners manage gallery entries for their projects"
ON public.gallery_skins
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.skin_projects p WHERE p.id = gallery_skins.project_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.skin_projects p WHERE p.id = gallery_skins.project_id AND p.user_id = auth.uid()));

CREATE POLICY "Signed-in users upload their own gallery images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery' AND owner = auth.uid());