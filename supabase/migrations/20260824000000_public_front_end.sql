-- Public front end: profiles, gate capacity, roles, orders, gallery, offer counters.
-- APPLIED BY HAND THROUGH THE LOVABLE UI. This file is a record, not a mechanism.

-- ---------- settings ----------
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  registration_cap INT NOT NULL DEFAULT 50
);
INSERT INTO public.app_settings (id, registration_cap) VALUES (1, 50);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No policies: readable only through SECURITY DEFINER functions below.

-- ---------- profiles ----------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  source_offer TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source_offer IN ('ai-helper','build','custom','unknown')),
  platform TEXT NOT NULL DEFAULT 'unsure'
    CHECK (platform IN ('java','bedrock','unsure')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

CREATE POLICY "Users read their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- roles ----------
CREATE TYPE public.app_role AS ENUM ('guardian','creator');

CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  PRIMARY KEY (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Deliberately no INSERT/UPDATE/DELETE policy for authenticated.
-- Roles are assigned only by service_role or through the Lovable SQL UI.
CREATE POLICY "Users read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- SECURITY DEFINER so policies can call it without recursing through RLS.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
) $$;

-- ---------- capacity ----------
CREATE OR REPLACE FUNCTION public.registration_open()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT (SELECT count(*) FROM public.profiles)
            < (SELECT registration_cap FROM public.app_settings WHERE id = 1) $$;

GRANT EXECUTE ON FUNCTION public.registration_open() TO anon, authenticated;

-- Creates the profile and enforces the cap for real. A client that skips the
-- registration_open() check still cannot get past this.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.registration_open() THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;
  INSERT INTO public.profiles (id, source_offer, platform)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'source_offer', 'unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'platform', 'unsure')
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- waitlist ----------
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source_offer TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source_offer IN ('ai-helper','build','custom','unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.waitlist TO anon, authenticated;

-- Insert only. Nobody reads the waitlist through the client; Mike reads it in Lovable.
CREATE POLICY "Anyone may join the waitlist"
ON public.waitlist FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- ---------- orders ----------
CREATE TYPE public.order_status AS ENUM
  ('submitted','released','in_progress','delivered');

CREATE TABLE public.skin_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  brief TEXT NOT NULL,
  reference_path TEXT,
  platform TEXT NOT NULL DEFAULT 'unsure'
    CHECK (platform IN ('java','bedrock','unsure')),
  price_intent TEXT NOT NULL DEFAULT 'exploring',
  status public.order_status NOT NULL DEFAULT 'submitted',
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES auth.users,
  creator_id UUID REFERENCES auth.users,
  delivered_project_id UUID REFERENCES public.skin_projects ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skin_orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.skin_orders TO authenticated;

CREATE POLICY "Customers manage their own orders"
ON public.skin_orders FOR SELECT TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Customers create their own orders"
ON public.skin_orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Guardian reads every order"
ON public.skin_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'guardian'));

CREATE POLICY "Guardian updates every order"
ON public.skin_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'guardian'))
WITH CHECK (public.has_role(auth.uid(), 'guardian'));

-- The creator sees an order only once the guardian has released it to her.
CREATE POLICY "Creator reads released orders"
ON public.skin_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'creator')
       AND status <> 'submitted' AND creator_id = auth.uid());

CREATE POLICY "Creator updates released orders"
ON public.skin_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'creator')
       AND status <> 'submitted' AND creator_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'creator') AND creator_id = auth.uid());

CREATE INDEX skin_orders_status_idx ON public.skin_orders (status, created_at DESC);

CREATE TRIGGER skin_orders_set_updated_at
BEFORE UPDATE ON public.skin_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- gallery ----------
CREATE TABLE public.gallery_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  inspiration_path TEXT NOT NULL,
  ingame_path TEXT NOT NULL,
  skin_png_path TEXT,
  made_with TEXT NOT NULL CHECK (made_with IN ('ai-helper','build','custom')),
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_skins ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.gallery_skins TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_skins TO authenticated;

CREATE POLICY "Anyone reads published skins"
ON public.gallery_skins FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Creator reads every skin"
ON public.gallery_skins FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Creator writes the gallery"
ON public.gallery_skins FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'creator'))
WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE INDEX gallery_skins_published_idx
ON public.gallery_skins (published, sort_order, created_at DESC);

-- ---------- offer view counters ----------
CREATE TABLE public.offer_views (
  offer TEXT PRIMARY KEY
    CHECK (offer IN ('home','ai-helper','build','custom','skins')),
  views BIGINT NOT NULL DEFAULT 0
);
INSERT INTO public.offer_views (offer) VALUES
  ('home'),('ai-helper'),('build'),('custom'),('skins');
ALTER TABLE public.offer_views ENABLE ROW LEVEL SECURITY;
-- No policies. Written only through the SECURITY DEFINER function, read in Lovable.

CREATE OR REPLACE FUNCTION public.record_offer_view(_offer TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.offer_views SET views = views + 1 WHERE offer = _offer;
END; $$;

GRANT EXECUTE ON FUNCTION public.record_offer_view(TEXT) TO anon, authenticated;

-- ---------- storage ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery','gallery', true), ('order-refs','order-refs', false);

CREATE POLICY "Anyone reads gallery images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'gallery');

CREATE POLICY "Creator writes gallery images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Customers upload their own order refs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'order-refs' AND owner = auth.uid());

CREATE POLICY "Guardian and creator read order refs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'order-refs'
       AND (owner = auth.uid()
            OR public.has_role(auth.uid(), 'guardian')
            OR public.has_role(auth.uid(), 'creator')));
