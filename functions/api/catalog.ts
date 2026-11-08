interface Env { DB: D1Database }
export const onRequestGet = async ({ env }: { env: Env }) => {
 const now=Date.now();
 const series=await env.DB.prepare("SELECT id,title,synopsis,genre,year,poster_url,featured FROM series ORDER BY featured DESC,created_at DESC").all();
 const episodes=await env.DB.prepare("SELECT id,series_id,season_number,episode_number,title,synopsis,youtube_url,status,scheduled_at FROM episodes WHERE status IN ('published','scheduled') ORDER BY season_number,episode_number").all();
 const items=(episodes.results||[]).map((episode:any)=>({...episode,available:episode.status==="published"||(episode.status==="scheduled"&&Number(episode.scheduled_at)<=now)}));
 return Response.json({serverNow:now,series:series.results||[],episodes:items},{headers:{"Cache-Control":"no-store"}});
};