interface Env { DB: D1Database }
const enc=(bytes:Uint8Array)=>btoa(Array.from(bytes,x=>String.fromCharCode(x)).join("")).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const hash=async(token:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
async function checkPin(pin:string,stored:string){try{const [salt,expected]=stored.split(":");const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:Uint8Array.from(atob(salt),c=>c.charCodeAt(0)),iterations:150000,hash:"SHA-256"},key,256);return enc(new Uint8Array(bits))===expected;}catch{return false;}}
export const onRequestPost=async({request,env}:any)=>{
 if(!env.DB)return Response.json({error:"Banco de dados indisponível."},{status:503});
 const ip=request.headers.get("CF-Connecting-IP")||"unknown",now=Date.now();
 await env.DB.prepare("DELETE FROM admin_login_attempts WHERE attempted_at < ?").bind(now-86400000).run();
 const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM admin_login_attempts WHERE ip=? AND attempted_at>?").bind(ip,now-15*60*1000).first();
 if(Number(count?.total||0)>=5)return Response.json({error:"Muitas tentativas. Aguarde 15 minutos e tente novamente."},{status:429,headers:{"Retry-After":"900","Cache-Control":"no-store"}});
 let body:any={};try{body=await request.json();}catch{return Response.json({error:"Requisição inválida."},{status:400});}
 const pin=String(body.pin||"");
 const config=await env.DB.prepare("SELECT value FROM admin_config WHERE key='pin_hash'").first<{value:string}>();
 if(!config?.value||!/^[-A-Za-z0-9_+=/]{16,160}$/.test(pin)||!await checkPin(pin,config.value)){
  await env.DB.prepare("INSERT INTO admin_login_attempts(ip,attempted_at) VALUES(?,?)").bind(ip,now).run();
  return Response.json({error:"Senha incorreta."},{status:401,headers:{"Cache-Control":"no-store"}});
 }
 await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip=?").bind(ip).run();
 const random=new Uint8Array(32);crypto.getRandomValues(random);const token=enc(random);const expires=now+12*60*60*1000;
 await env.DB.prepare("INSERT INTO admin_sessions(token_hash,expires_at,created_at) VALUES(?,?,?)").bind(await hash(token),expires,now).run();
 const headers=new Headers({"Content-Type":"application/json","Cache-Control":"no-store"});
 headers.append("Set-Cookie",`cv_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=43200`);
 return new Response(JSON.stringify({authenticated:true}),{status:200,headers});
};