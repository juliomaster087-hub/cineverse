interface Env{DB:D1Database}
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
export const onRequestPost=async({request,env}:any)=>{
 const token=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/)?.[1];
 if(token){const digest=hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(digest).run();}
 const h=new Headers({"Content-Type":"application/json","Cache-Control":"no-store"});h.append("Set-Cookie","cv_session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0");return new Response(JSON.stringify({ok:true}),{headers:h});
};