const ADMIN_EMAIL = "likasousa2024@gmail.com";
const decode = (part: string) => {
  const raw = atob(part.replace(/-/g,"+").replace(/_/g,"/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};
const parse = (part: string) => JSON.parse(new TextDecoder().decode(decode(part)));
async function verifyAccess(token:string, team:string, audience:string) {
  const parts=token.split(".");
  if(parts.length!==3) return false;
  const header=parse(parts[0]), payload=parse(parts[1]);
  if(header.alg!=="RS256" || !header.kid) return false;
  const response=await fetch("https://"+team+"/cdn-cgi/access/certs");
  if(!response.ok) return false;
  const keys:any=await response.json();
  const cert=(keys.public_certs||[]).find((item:any)=>item.kid===header.kid);
  if(!cert?.public_key) return false;
  const key=await crypto.subtle.importKey("jwk",cert.public_key,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
  const aud=Array.isArray(payload.aud)?payload.aud:[payload.aud];
  return valid && aud.includes(audience) && payload.email?.toLowerCase()===ADMIN_EMAIL && payload.iss==="https://"+team && Number(payload.exp)>Math.floor(Date.now()/1000);
}
export const onRequest = async ({request,next,env}:any) => {
  const email=request.headers.get("cf-access-authenticated-user-email")?.trim().toLowerCase();
  const jwt=request.headers.get("cf-access-jwt-assertion");
  if(!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !jwt || email!==ADMIN_EMAIL) return Response.json({error:"Acesso privado. Cloudflare Access ainda não está configurado para este painel."},{status:403});
  try { if(!(await verifyAccess(jwt,env.ACCESS_TEAM_DOMAIN,env.ACCESS_AUD))) throw new Error("invalid token"); }
  catch { return Response.json({error:"Sessão de acesso inválida. Entre novamente pelo Cloudflare Access."},{status:403}); }
  return next();
};