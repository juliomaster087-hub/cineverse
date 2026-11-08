interface Env{DB:D1Database}
const enc=(b:ArrayBuffer|Uint8Array)=>{const a=b instanceof Uint8Array?b:new Uint8Array(b);let s="";for(const x of a)s+=String.fromCharCode(x);return btoa(s).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");};
async function hashPin(pin:string,stored:string){try{const [salt,expected]=stored.split(":");const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:Uint8Array.from(atob(salt),c=>c.charCodeAt(0)),iterations:150000,hash:"SHA-256"},key,256);return enc(bits)===expected;}catch{return false;}}
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
export const onRequestPost=async({request,env}:any)=>{
 const ip=request.headers.get("CF-Connecting-IP")||"unknown",now=Date.now();
 await env.DB.prepare("DELETE FROM admin_login_attempts WHERE attempted_at < ?").bind(now-86400000).run();
 const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM admin_login_attempts WHERE ip=? AND attempted_at>?").bind(ip,now-15*60*1000).first() as any;
 if(Number(count?.total||0)>=5)return Response.json({error:"Muitas tentativas. Aguarde 15 minutos."},{status:429,headers:{"Retry-After":"900"}});
 let body:any={};try{body=await request.json()}catch{return Response.json({error:"Requisição inválida."},{status:400});}
 const pin=String(body.pin||"");
 const config=await env.DB.prepare("SELECT value FROM admin_config WHERE key='pin_hash'").first() as any;
 if(!config?.value||pin.length<16||pin.length>64||/\\s/.test(pin)||!await hashPin(pin,config.value)){
  await env.DB.prepare("INSERT INTO admin_login_attempts(ip,attempted_at) VALUES(?,?)").bind(ip,now).run();
  return Response.json({error:"Senha incorreta."},{status:401,headers:{"Cache-Control":"no-store"}});
 }
 await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip=?").bind(ip).run();
 const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);const token=hex(bytes.buffer);
 const digest=hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));
 await env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at<=?").bind(now).run();
 await env.DB.prepare("INSERT INTO admin_sessions(token_hash,expires_at,created_at) VALUES(?,?,?)").bind(digest,now+12*60*60*1000,now).run();
 const headers=new Headers({"Content-Type":"application/json","Cache-Control":"no-store"});
 headers.append("Set-Cookie",`cv_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=43200`);
 return new Response(JSON.stringify({authenticated:true}),{status:200,headers});
};