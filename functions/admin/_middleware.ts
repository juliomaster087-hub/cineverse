interface Env { DB: D1Database }
const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const hash=async(token:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
async function valid(request:Request,env:Env){
 try{
  if(!env.DB)return false;
  const m=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/);
  if(!m)return false;
  const token=decodeURIComponent(m[1]);
  const row=await env.DB.prepare("SELECT expires_at FROM admin_sessions WHERE token_hash=?").bind(await hash(token)).first<{expires_at:number}>();
  return !!row && Number(row.expires_at)>Date.now();
 }catch{return false;}
}
export const onRequest=async({request,next,env}:any)=>{
 const path=new URL(request.url).pathname;
 if(path==="/admin"||path==="/admin/"||path==="/admin/api/access"||path==="/admin/api/session"||path==="/admin/api/logout")return next();
 if(path.startsWith("/admin/api/")&&!await valid(request,env))return Response.json({error:"Acesso não autorizado."},{status:401,headers:{"Cache-Control":"no-store"}});
 return next();
};
