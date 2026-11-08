interface Env{DB:D1Database;ADMIN_EMAIL:string;ADMIN_PIN_HASH:string;SESSION_SECRET:string}
const enc=(b:ArrayBuffer|Uint8Array)=>{const a=b instanceof Uint8Array?b:new Uint8Array(b);let s="";for(const x of a)s+=String.fromCharCode(x);return btoa(s).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");};
async function checkPin(pin:string,stored:string){try{const [salt,expected]=stored.split(":");const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:Uint8Array.from(atob(salt),c=>c.charCodeAt(0)),iterations:150000,hash:"SHA-256"},key,256);return enc(bits)===expected;}catch{return false;}}
export const onRequestPost=async({request,env}:any)=>{
 if(!env.DB||!env.ADMIN_PIN_HASH||!env.SESSION_SECRET||!env.ADMIN_EMAIL)return Response.json({error:"Painel ainda não configurado."},{status:503});
 const ip=request.headers.get("CF-Connecting-IP")||"unknown",now=Date.now();
 await env.DB.prepare("DELETE FROM admin_login_attempts WHERE attempted_at < ?").bind(now-86400000).run();
 const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM admin_login_attempts WHERE ip=? AND attempted_at>?").bind(ip,now-15*60*1000).first();
 if(Number(count?.total||0)>=5)return Response.json({error:"Muitas tentativas. Aguarde 15 minutos e tente novamente."},{status:429,headers:{"Retry-After":"900"}});
 let body:any={};try{body=await request.json();}catch{return Response.json({error:"Requisição inválida."},{status:400});}
 const pin=String(body.pin||"");
 if(!/^[0-9]{3,32}$/.test(pin)||!await checkPin(pin,env.ADMIN_PIN_HASH)){
  await env.DB.prepare("INSERT INTO admin_login_attempts(ip,attempted_at) VALUES(?,?)").bind(ip,now).run();
  return Response.json({error:"Senha incorreta."},{status:401,headers:{"Cache-Control":"no-store"}});
 }
 await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip=?").bind(ip).run();
 const payload=enc(new TextEncoder().encode(JSON.stringify({email:String(env.ADMIN_EMAIL).trim().toLowerCase(),exp:now+12*60*60*1000})));
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=enc(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
 const headers=new Headers({"Content-Type":"application/json","Cache-Control":"no-store"});headers.append("Set-Cookie",`cv_session=${payload}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=43200`);
 return new Response(JSON.stringify({authenticated:true}),{status:200,headers});
};
