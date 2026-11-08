interface Env{DB:D1Database}
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
async function authorized(request:Request,env:Env){
 try{
  const cookie=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/)?.[1];
  if(!cookie||cookie.length<40||cookie.length>100)return false;
  const digest=hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(cookie)));
  const row=await env.DB.prepare("SELECT expires_at FROM admin_sessions WHERE token_hash=?").bind(digest).first() as any;
  return !!row&&Number(row.expires_at)>Date.now();
 }catch{return false;}
}
export const onRequest=async({request,next,env}:any)=>{
 const path=new URL(request.url).pathname;
 if(path==="/admin"||path==="/admin/"||path==="/admin/api/login"||path==="/admin/api/session"||path==="/admin/api/logout")return next();
 if(path.startsWith("/admin/api/")&&!await authorized(request,env))return Response.json({error:"Acesso não autorizado."},{status:401,headers:{"Cache-Control":"no-store"}});
 return next();
};