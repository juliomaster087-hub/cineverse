interface Env { DB: any }
export const onRequestGet = async ({env}:any) => {
 const [series,episodes]=await Promise.all([env.DB.prepare("SELECT * FROM series ORDER BY created_at DESC").all(),env.DB.prepare("SELECT * FROM episodes ORDER BY created_at DESC").all()]);
 const now=Date.now();
 return Response.json({series:series.results||[],episodes:(episodes.results||[]).map((e:any)=>({...e,released:e.status==="published"||(e.status==="scheduled"&&Number(e.scheduled_at)<=now)}))},{headers:{"Cache-Control":"no-store"}});
};