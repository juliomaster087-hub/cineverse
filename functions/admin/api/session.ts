interface Env{ADMIN_EMAIL:string;SESSION_SECRET:string}
const dec=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
export const onRequestGet=async({request,env}:any)=>{
 try{const m=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/);if(!m||!env.SESSION_SECRET)throw 0;const [p,s]=m[1].split(".");const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);if(!await crypto.subtle.verify("HMAC",k,dec(s),new TextEncoder().encode(p)))throw 0;const d=JSON.parse(new TextDecoder().decode(dec(p)));if(d.exp<=Date.now()||d.email!==String(env.ADMIN_EMAIL||"").trim().toLowerCase())throw 0;return Response.json({authenticated:true},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({authenticated:false},{status:401,headers:{"Cache-Control":"no-store"}});}
};
