
-- Enums
CREATE TYPE public.user_role AS ENUM ('student', 'faculty');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.item_status AS ENUM ('open', 'claimed', 'recovered', 'closed');
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lost items
CREATE TABLE public.lost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  location_lost TEXT,
  date_lost DATE,
  image_url TEXT,
  status public.item_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_items TO authenticated;
GRANT ALL ON public.lost_items TO service_role;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lost_select_all_auth" ON public.lost_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "lost_insert_own" ON public.lost_items FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "lost_update_own_or_admin" ON public.lost_items FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lost_delete_own_or_admin" ON public.lost_items FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Found items — hidden_details and finder_contact are protected
CREATE TABLE public.found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  public_description TEXT,
  hidden_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  finder_contact TEXT,
  location_found TEXT,
  date_found DATE,
  image_url TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  status public.item_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.found_items TO authenticated;
GRANT ALL ON public.found_items TO service_role;
ALTER TABLE public.found_items ENABLE ROW LEVEL SECURITY;
-- Everyone authenticated can SELECT rows, but the app MUST select only public columns.
-- Extra safety: create a public view that omits hidden fields.
CREATE POLICY "found_select_all_auth" ON public.found_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "found_insert_own" ON public.found_items FOR INSERT TO authenticated WITH CHECK (finder_id = auth.uid());
CREATE POLICY "found_update_own_or_admin" ON public.found_items FOR UPDATE TO authenticated
  USING (finder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (finder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "found_delete_own_or_admin" ON public.found_items FOR DELETE TO authenticated
  USING (finder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Public-safe view (omits hidden_details, finder_contact)
CREATE VIEW public.found_items_public
WITH (security_invoker = true)
AS SELECT id, finder_id, title, category, public_description, location_found,
          date_found, image_url, images, status, created_at
   FROM public.found_items;
GRANT SELECT ON public.found_items_public TO authenticated;

-- Claims
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.found_items(id) ON DELETE CASCADE,
  claimer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  message TEXT,
  status public.claim_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_item_finder(_item_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.found_items WHERE id = _item_id AND finder_id = _user_id)
$$;

CREATE POLICY "claims_select_relevant" ON public.claims FOR SELECT TO authenticated USING (
  claimer_id = auth.uid()
  OR public.is_item_finder(item_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "claims_insert_own" ON public.claims FOR INSERT TO authenticated WITH CHECK (claimer_id = auth.uid());
CREATE POLICY "claims_update_finder_or_admin" ON public.claims FOR UPDATE TO authenticated
  USING (public.is_item_finder(item_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_item_finder(item_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "claims_delete_admin" ON public.claims FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_insert_any_auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'),
    NEW.raw_user_meta_data->>'department'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notify claimer when claim status changes
CREATE OR REPLACE FUNCTION public.notify_on_claim_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item_title TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO item_title FROM public.found_items WHERE id = NEW.item_id;
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.claimer_id,
      'Your claim was ' || NEW.status,
      'Claim on "' || COALESCE(item_title, 'item') || '" is ' || NEW.status,
      '/items/' || NEW.item_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER claim_status_notify
AFTER UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.notify_on_claim_status();

-- Notify finder on new claim
CREATE OR REPLACE FUNCTION public.notify_finder_on_claim()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  fid UUID; item_title TEXT;
BEGIN
  SELECT finder_id, title INTO fid, item_title FROM public.found_items WHERE id = NEW.item_id;
  IF fid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (fid, 'New claim submitted', 'Someone claimed "' || COALESCE(item_title,'your item') || '"', '/items/' || NEW.item_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER claim_new_notify
AFTER INSERT ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.notify_finder_on_claim();
