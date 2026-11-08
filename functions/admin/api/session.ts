interface Env { DB: D1Database }
const hash=async(token:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
export const onRequestGet=async({request,env}:any)=>{
 try{
  const m=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/);if(!m||!env.DB)throw 0;
  const token=decodeURIComponent(m[1]);
  const row=await env.DB.prepare("SELECT expires_at FROM admin_sessions WHERE token_hash=?").bind(await hash(token)).first<{expires_at:number}>();
  if(!row||Number(row.expires_at)<=Date.now()){if(row)await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await hash(token)).run();throw 0;}
  return Response.json({authenticated:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({authenticated:false},{status:401,headers:{"Cache-Control":"no-store"}});}
};