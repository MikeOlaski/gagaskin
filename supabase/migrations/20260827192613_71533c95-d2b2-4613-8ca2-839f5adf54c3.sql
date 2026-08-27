ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_lower_key ON public.profiles (lower(handle));

UPDATE public.profiles SET handle = 'GraceFull' WHERE id = 'b6d6e612-2553-4af5-9991-d1a01df08f76';
UPDATE public.profiles SET handle = 'MJ' WHERE id = '55425012-8be6-4a41-bec5-889eb1226c62';

ALTER TABLE public.gallery_skins ADD COLUMN IF NOT EXISTS author_handle text;

CREATE OR REPLACE FUNCTION public.set_gallery_author_handle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    SELECT pr.handle INTO NEW.author_handle
    FROM public.skin_projects sp
    JOIN public.profiles pr ON pr.id = sp.user_id
    WHERE sp.id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gallery_skins_author_handle ON public.gallery_skins;
CREATE TRIGGER gallery_skins_author_handle
BEFORE INSERT OR UPDATE OF project_id ON public.gallery_skins
FOR EACH ROW EXECUTE FUNCTION public.set_gallery_author_handle();

UPDATE public.gallery_skins g
SET author_handle = pr.handle
FROM public.skin_projects sp
JOIN public.profiles pr ON pr.id = sp.user_id
WHERE sp.id = g.project_id;