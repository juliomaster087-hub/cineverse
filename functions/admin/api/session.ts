interface Env{DB:D1Database}
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
export const onRequestGet=async({request,env}:any)=>{
 try{const token=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/)?.[1];if(!token)throw 0;const digest=hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));const row=await env.DB.prepare("SELECT expires_at FROM admin_sessions WHERE token_hash=?").bind(digest).first() as any;if(!row||Number(row.expires_at)<=Date.now())throw 0;return Response.json({authenticated:true},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({authenticated:false},{status:401,headers:{"Cache-Control":"no-store"}});}
};