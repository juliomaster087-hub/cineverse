interface Env { DB: D1Database }
const enc=(bytes:Uint8Array)=>btoa(Array.from(bytes,x=>String.fromCharCode(x)).join("")).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const hash=async(token:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
export const onRequestPost=async({request,env}:any)=>{
 if(!env.DB)return Response.json({error:"Banco de dados indisponível."},{status:503});
 let body:any={};try{body=await request.json();}catch{return Response.json({error:"Requisição inválida."},{status:400});}
 const key=String(body.key||"");
 if(key.length!==43)return Response.json({error:"Link privado inválido."},{status:401,headers:{"Cache-Control":"no-store"}});
 const config=await env.DB.prepare("SELECT value FROM admin_config WHERE key='admin_link_hash'").first<{value:string}>();
 if(!config?.value||await hash(key)!==config.value)return Response.json({error:"Link privado inválido."},{status:401,headers:{"Cache-Control":"no-store"}});
 const random=new Uint8Array(32);crypto.getRandomValues(random);const token=enc(random);const now=Date.now();const expires=now+12*60*60*1000;
 await env.DB.prepare("INSERT INTO admin_sessions(token_hash,expires_at,created_at) VALUES(?,?,?)").bind(await hash(token),expires,now).run();
 const headers=new Headers({"Content-Type":"application/json","Cache-Control":"no-store"});
 headers.append("Set-Cookie",`cv_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=43200`);
 return new Response(JSON.stringify({authenticated:true}),{status:200,headers});
};
