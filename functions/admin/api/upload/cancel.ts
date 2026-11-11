import { deleteStoredObject, getMediaProviders } from "../../../_shared/media-storage";

export const onRequestPost = async ({ request, env }: any) => {
  let body: any;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Dados inválidos." }, { status: 400 }); }
  const id = String(body.upload_id || "");
  if (!/^[a-f0-9-]{36}$/.test(id)) return Response.json({ error: "Upload não encontrado." }, { status: 404 });
  const row = await env.DB.prepare("SELECT provider_id,object_key FROM media_objects WHERE id=? AND status IN ('uploading','ready')").bind(id).first();
  if (!row) return Response.json({ success: true });
  const provider = getMediaProviders(env).find((item) => item.id === row.provider_id);
  if (provider) {
    try { await deleteStoredObject(provider, row.object_key); } catch {}
  }
  await env.DB.prepare("UPDATE media_objects SET status='deleted' WHERE id=?").bind(id).run();
  return Response.json({ success: true });
};
