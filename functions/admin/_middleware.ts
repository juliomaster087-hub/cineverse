type Env={ADMIN_EMAIL:string;SESSION_SECRET:string};
const dec=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
async function valid(request:Request,env:Env){
 try{const m=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/);if(!m||!env.SESSION_SECRET)return false;const [p,s]=m[1].split(".");if(!p||!s)return false;const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);if(!await crypto.subtle.verify("HMAC",k,dec(s),new TextEncoder().encode(p)))return false;const d=JSON.parse(new TextDecoder().decode(dec(p)));return d.email===String(env.ADMIN_EMAIL||"").trim().toLowerCase()&&d.exp>Date.now();}catch{return false;}
}
export const onRequest=async({request,next,env}:any)=>{
 const path=new URL(request.url).pathname;
 if(path==="/admin"||path==="/admin/"||path==="/admin/api/login"||path==="/admin/api/session"||path==="/admin/api/logout")return next();
 if(path.startsWith("/admin/api/")&&!await valid(request,env))return Response.json({error:"Acesso não autorizado."},{status:401,headers:{"Cache-Control":"no-store"}});
 return next();
};
