
DROP POLICY IF EXISTS "notif_insert_any_auth" ON public.notifications;
CREATE POLICY "notif_insert_own" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
