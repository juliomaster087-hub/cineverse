type Env = { ADMIN_EMAIL:string; GOOGLE_CLIENT_ID:string; GOOGLE_CLIENT_SECRET:string; SESSION_SECRET:string };
const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const encode=(b:ArrayBuffer|Uint8Array)=>{const a=b instanceof Uint8Array?b:new Uint8Array(b);let s="";for(const x of a)s+=String.fromCharCode(x);return btoa(s).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");};
async function validSession(request:Request,env:Env){
 try{
  const cookie=request.headers.get("Cookie")||"",m=cookie.match(/(?:^|; )cv_session=([^;]+)/);if(!m||!env.SESSION_SECRET)return false;
  const [payload,sig]=m[1].split(".");if(!payload||!sig)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  const ok=await crypto.subtle.verify("HMAC",key,decode(sig),new TextEncoder().encode(payload));if(!ok)return false;
  const data=JSON.parse(new TextDecoder().decode(decode(payload)));
  return data.email===String(env.ADMIN_EMAIL||"").toLowerCase()&&data.exp>Date.now();
 }catch{return false;}
}
export const onRequest=async({request,next,env}:any)=>{
 const ok=await validSession(request,env);
 if(ok)return next();
 const path=new URL(request.url).pathname;
 if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.SESSION_SECRET||!env.ADMIN_EMAIL){
  return new Response("O painel está em configuração. As credenciais de login do Google ainda não foram adicionadas.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
 }
 if(path==="/admin"||path==="/admin/")return Response.redirect(new URL("/auth/google",request.url),302);
 return Response.json({error:"Faça login com a conta Google autorizada."},{status:401,headers:{"Cache-Control":"no-store"}});
};
