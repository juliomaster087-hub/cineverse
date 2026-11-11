import { getMediaProviders } from "../../../_shared/media-storage";

interface Env { DB: any; MEDIA_STORAGE_PROVIDERS?: string }

export const onRequestGet = async ({ env }: any) => {
  const configured = getMediaProviders(env);
  const providers = [];
  for (const provider of configured) {
    const usage = await env.DB.prepare(
      "SELECT COALESCE(SUM(size_bytes),0) AS used_bytes FROM media_objects WHERE provider_id=? AND status IN ('uploading','ready')"
    ).bind(provider.id).first();
    const usedBytes = Number(usage?.used_bytes || 0);
    providers.push({
      id: provider.id,
      type: provider.type,
      label: provider.label,
      free_limit_bytes: provider.freeLimitBytes,
      used_bytes: usedBytes,
      remaining_bytes: Math.max(0, provider.freeLimitBytes - usedBytes),
    });
  }
  return Response.json({ providers }, { headers: { "Cache-Control": "no-store" } });
};
