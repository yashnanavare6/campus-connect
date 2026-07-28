
CREATE OR REPLACE FUNCTION public.notify_finder_on_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fid UUID;
  item_title TEXT;
  claimer_name TEXT;
  claimer_email TEXT;
BEGIN
  SELECT finder_id, title INTO fid, item_title FROM public.found_items WHERE id = NEW.item_id;
  SELECT name, email INTO claimer_name, claimer_email FROM public.profiles WHERE id = NEW.claimer_id;
  IF fid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      fid,
      'New claim on "' || COALESCE(item_title, 'your item') || '"',
      COALESCE(claimer_name, 'Someone') || ' (' || COALESCE(claimer_email, 'no email') || ') submitted a claim. Review their answers and approve to share your contact.',
      '/items/' || NEW.item_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_claim_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_title TEXT;
  finder_contact TEXT;
  fid UUID;
  finder_name TEXT;
  finder_email TEXT;
  claimer_name TEXT;
  claimer_email TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title, finder_contact, finder_id INTO item_title, finder_contact, fid
      FROM public.found_items WHERE id = NEW.item_id;
    SELECT name, email INTO finder_name, finder_email FROM public.profiles WHERE id = fid;
    SELECT name, email INTO claimer_name, claimer_email FROM public.profiles WHERE id = NEW.claimer_id;

    -- notify claimer
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.claimer_id,
      'Your claim was ' || NEW.status,
      CASE WHEN NEW.status = 'approved'
        THEN 'Claim on "' || COALESCE(item_title,'item') || '" approved. Finder: ' ||
             COALESCE(finder_name,'') || ' (' || COALESCE(finder_email,'') || ')' ||
             CASE WHEN finder_contact IS NOT NULL THEN ' · Contact: ' || finder_contact ELSE '' END
        ELSE 'Claim on "' || COALESCE(item_title,'item') || '" is ' || NEW.status
      END,
      '/items/' || NEW.item_id
    );

    -- notify finder on approve so they have claimer contact too
    IF NEW.status = 'approved' AND fid IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (
        fid,
        'You approved a claim on "' || COALESCE(item_title,'your item') || '"',
        'Reach out to ' || COALESCE(claimer_name,'the claimer') || ' at ' || COALESCE(claimer_email,'their email') || ' to arrange handover.',
        '/items/' || NEW.item_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_finder_on_claim ON public.claims;
CREATE TRIGGER trg_notify_finder_on_claim
AFTER INSERT ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.notify_finder_on_claim();

DROP TRIGGER IF EXISTS trg_notify_on_claim_status ON public.claims;
CREATE TRIGGER trg_notify_on_claim_status
AFTER UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.notify_on_claim_status();
