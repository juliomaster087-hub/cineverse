interface Env { DB: D1Database }
const hash=async(token:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
export const onRequestPost=async({request,env}:any)=>{
 const m=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/);
 if(m&&env.DB){try{await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await hash(decodeURIComponent(m[1]))).run();}catch{}}
 const h=new Headers({"Content-Type":"application/json","Cache-Control":"no-store"});h.append("Set-Cookie","cv_session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0");
 return new Response(JSON.stringify({ok:true}),{headers:h});
};