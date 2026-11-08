type Env={GOOGLE_CLIENT_ID:string;GOOGLE_CLIENT_SECRET:string;ADMIN_EMAIL:string;SESSION_SECRET:string};
const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const encode=(b:ArrayBuffer|Uint8Array)=>{const a=b instanceof Uint8Array?b:new Uint8Array(b);let s="";for(const x of a)s+=String.fromCharCode(x);return btoa(s).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");};
const cookie=(request:Request,name:string)=>{const m=(request.headers.get("Cookie")||"").match(new RegExp("(?:^|; )"+name+"=([^;]+)"));return m?.[1]||"";};
async function verifyIdToken(token:string,env:Env,nonce:string){
 const parts=token.split(".");if(parts.length!==3)throw new Error("Token inválido");
 const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),payload=JSON.parse(new TextDecoder().decode(decode(parts[1])));
 if(header.alg!=="RS256"||!header.kid)throw new Error("Assinatura inválida");
 const keys=await fetch("https://www.googleapis.com/oauth2/v3/certs").then(r=>r.json() as any),jwk=keys.keys?.find((k:any)=>k.kid===header.kid);if(!jwk)throw new Error("Chave Google não encontrada");
 const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
 const aud=Array.isArray(payload.aud)?payload.aud:[payload.aud];
 if(!valid||!aud.includes(env.GOOGLE_CLIENT_ID)||!["accounts.google.com","https://accounts.google.com"].includes(payload.iss)||payload.exp<=Date.now()/1000||payload.nonce!==nonce||payload.email_verified!==true)throw new Error("Não foi possível validar sua conta Google");
 return String(payload.email||"").toLowerCase();
}
export const onRequestGet=async({request,env}:any)=>{
 const url=new URL(request.url),state=url.searchParams.get("state")||"",code=url.searchParams.get("code")||"";
 const stateCookie=cookie(request,"cv_oauth_state"),nonce=cookie(request,"cv_oauth_nonce");
 const clear="cv_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=0, cv_oauth_nonce=; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=0";
 const fail=(message:string,status=401)=>new Response(message,{status,headers:{"Content-Type":"text/plain; charset=utf-8","Set-Cookie":clear}});
 if(!state||!stateCookie||state!==stateCookie||!nonce||!code)return fail("Não foi possível validar o início do login. Volte ao painel e tente novamente.");
 try{
  const redirectUri=new URL("/auth/callback",request.url).toString();
  const form=new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirectUri,grant_type:"authorization_code"});
  const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form});
  const tokenData:any=await tokenResponse.json();if(!tokenResponse.ok||!tokenData.id_token)throw new Error("Falha na autenticação Google");
  const email=await verifyIdToken(tokenData.id_token,env,nonce);
  if(!env.ADMIN_EMAIL||email!==String(env.ADMIN_EMAIL).trim().toLowerCase())return fail("Esta conta Google não tem autorização para administrar o CineVerse.",403);
  const payload=encode(new TextEncoder().encode(JSON.stringify({email,exp:Date.now()+7*24*60*60*1000})));
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=encode(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
  return new Response(null,{status:302,headers:{"Location":new URL("/admin",request.url).toString(),"Set-Cookie":`cv_session=${payload}.${signature}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`, "Cache-Control":"no-store"}});
 }catch(e){return fail("Erro ao entrar com Google. Verifique a configuração OAuth e tente novamente.",500);}
};
