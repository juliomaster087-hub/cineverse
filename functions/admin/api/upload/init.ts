import { getMediaProviders, presignObject, publicObjectUrl } from "../../../_shared/media-storage";

interface Env { DB: any; MEDIA_STORAGE_PROVIDERS?: string }
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const onRequestPost = async ({ request, env }: any) => {
  let body: any;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Dados do upload inválidos." }, { status: 400 }); }

  const contentType = String(body.content_type || "").toLowerCase();
  const extension = TYPES[contentType];
  const size = Number(body.size_bytes);
  if (!extension) return Response.json({ error: "Formato não aceito. Use MP4, WebM ou MOV." }, { status: 415 });
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "O arquivo deve ter até 2 GB." }, { status: 413 });
  }

  const providers = getMediaProviders(env);
  if (!providers.length) {
    return Response.json({
      error: "Nenhum armazenamento gratuito está conectado. O CineVerse precisa de pelo menos um provedor configurado pelo responsável da conta.",
      code: "NO_MEDIA_PROVIDER",
    }, { status: 503 });
  }

  const candidates = [];
  for (const provider of providers) {
    const usage = await env.DB.prepare(
      "SELECT COALESCE(SUM(size_bytes),0) AS used_bytes FROM media_objects WHERE provider_id=? AND status IN ('uploading','ready')"
    ).bind(provider.id).first();
    const used = Number(usage?.used_bytes || 0);
    const remaining = Math.max(0, provider.freeLimitBytes - used);
    if (remaining >= size) candidates.push({ provider, used, remaining, ratio: used / provider.freeLimitBytes });
  }
  candidates.sort((a, b) => a.ratio - b.ratio);

  const selected = candidates[0];
  if (!selected) {
    return Response.json({
      error: "Os provedores conectados não têm espaço gratuito suficiente para este arquivo. Nenhum upload foi iniciado.",
      code: "FREE_STORAGE_EXHAUSTED",
    }, { status: 507 });
  }

  const id = crypto.randomUUID();
  const objectKey = "cineverse/" + id + "." + extension;
  const publicUrl = publicObjectUrl(selected.provider, objectKey);
  try {
    const uploadUrl = await presignObject(selected.provider, "PUT", objectKey, 900);
    await env.DB.prepare(
      "INSERT INTO media_objects (id,provider_id,provider_type,object_key,public_url,size_bytes,content_type,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(id, selected.provider.id, selected.provider.type, objectKey, publicUrl, size, contentType, "uploading", Date.now()).run();
    return Response.json({
      upload_id: id,
      provider_id: selected.provider.id,
      provider_label: selected.provider.label,
      object_key: objectKey,
      public_url: publicUrl,
      upload_url: uploadUrl,
      size_bytes: size,
      expires_in: 900,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Não foi possível preparar o destino de armazenamento." }, { status: 502 });
  }
};
