import { getMediaProviders, presignObject, reserveMonthlyOperation } from "../../../_shared/media-storage";

interface Env { DB: any; MEDIA_STORAGE_PROVIDERS?: string }

export const onRequestPost = async ({ request, env }: any) => {
  let body: any;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Dados inválidos." }, { status: 400 }); }

  const id = String(body.upload_id || "");
  if (!/^[a-f0-9-]{36}$/.test(id)) return Response.json({ error: "Upload não encontrado." }, { status: 404 });
  const row = await env.DB.prepare(
    "SELECT * FROM media_objects WHERE id=? AND status='uploading'"
  ).bind(id).first();
  if (!row) return Response.json({ error: "Upload não encontrado ou já finalizado." }, { status: 404 });

  const provider = getMediaProviders(env).find((item) => item.id === row.provider_id);
  if (!provider) return Response.json({ error: "O provedor usado neste upload não está mais configurado." }, { status: 503 });

  const operation = await reserveMonthlyOperation(env.DB, provider, "read");
  if (!operation.allowed) return Response.json({ error: "O limite mensal gratuito de verificações foi atingido." }, { status: 429 });

  try {
    const headUrl = await presignObject(provider, "HEAD", row.object_key, 300);
    const head = await fetch(headUrl, { method: "HEAD" });
    if (!head.ok) {
      await env.DB.prepare("UPDATE media_objects SET status='failed' WHERE id=?").bind(id).run();
      return Response.json({ error: "O provedor ainda não confirmou o recebimento do arquivo." }, { status: 409 });
    }
    const receivedSize = Number(head.headers.get("content-length") || 0);
    if (receivedSize && receivedSize !== Number(row.size_bytes)) {
      await env.DB.prepare("UPDATE media_objects SET status='failed' WHERE id=?").bind(id).run();
      return Response.json({ error: "O tamanho recebido não corresponde ao arquivo enviado." }, { status: 409 });
    }
    await env.DB.prepare("UPDATE media_objects SET status='ready' WHERE id=?").bind(id).run();
    return Response.json({
      success: true,
      upload_id: id,
      provider_id: row.provider_id,
      object_key: row.object_key,
      public_url: row.public_url,
      size_bytes: row.size_bytes,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Não foi possível verificar o arquivo no armazenamento." }, { status: 502 });
  }
};
