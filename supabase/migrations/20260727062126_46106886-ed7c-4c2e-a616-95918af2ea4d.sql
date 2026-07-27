
-- Storage: item-images
CREATE POLICY "item_images_read_auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'item-images');
CREATE POLICY "item_images_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "item_images_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "item_images_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'item-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_item_finder(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_claim_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_finder_on_claim() FROM PUBLIC, anon, authenticated;
