interface Env { DB: D1Database }
export const onRequestPatch = async ({ request, env, params }: any) => {
  const id = String(params.id);
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }
  const current: any = await env.DB.prepare("SELECT * FROM episodes WHERE id = ?").bind(id).first();
  if (!current) return Response.json({ error: "Episódio não encontrado." }, { status: 404 });
  const mode = body.mode || current.status;
  const releaseAt = mode === "scheduled" ? new Date(body.scheduled_at || current.scheduled_at).getTime() : null;
  if (mode === "scheduled" && (!Number.isFinite(releaseAt) || releaseAt <= Date.now())) return Response.json({ error: "Escolha uma data e horário futuros." }, { status: 400 });
  await env.DB.prepare("UPDATE episodes SET status=?, scheduled_at=?, updated_at=? WHERE id=?")
    .bind(mode, releaseAt, Date.now(), id).run();
  return Response.json({ success: true });
};
export const onRequestDelete = async ({ env, params }: any) => {
  await env.DB.prepare("DELETE FROM episodes WHERE id = ?").bind(String(params.id)).run();
  return Response.json({ success: true });
};