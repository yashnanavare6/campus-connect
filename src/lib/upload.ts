import { supabase } from "@/integrations/supabase/client";

export const IMAGE_BUCKET = "item-images";

export async function uploadItemImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function getImageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export function useImageUrl(path: string | null | undefined) {
  return path;
}
