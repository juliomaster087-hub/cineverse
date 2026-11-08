interface Env { DB: D1Database }
const id = () => crypto.randomUUID();
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido." }, { status: 400 }); }
  const title = String(body.title || "").trim();
  if (!title) return Response.json({ error: "Informe o nome da série." }, { status: 400 });
  const now = Date.now();
  const seriesId = id();
  await env.DB.prepare("INSERT INTO series (id,title,synopsis,genre,year,poster_url,featured,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .bind(seriesId, title, String(body.synopsis || "").trim(), String(body.genre || "").trim(), Number(body.year) || null, String(body.poster_url || "").trim(), body.featured ? 1 : 0, now, now).run();
  return Response.json({ success: true, id: seriesId }, { status: 201 });
};