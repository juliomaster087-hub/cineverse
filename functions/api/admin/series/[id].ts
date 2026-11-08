interface Env { DB: D1Database }
export const onRequestDelete = async ({ env, params }: any) => {
  await env.DB.prepare("DELETE FROM episodes WHERE series_id = ?").bind(String(params.id)).run();
  await env.DB.prepare("DELETE FROM series WHERE id = ?").bind(String(params.id)).run();
  return Response.json({ success: true });
};