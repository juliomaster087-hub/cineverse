type Env={GOOGLE_CLIENT_ID:string;ADMIN_EMAIL:string};
export const onRequestGet=async({request,env}:any)=>{
 if(!env.GOOGLE_CLIENT_ID)return new Response("Login Google ainda não configurado.",{status:503});
 const state=crypto.randomUUID(),nonce=crypto.randomUUID(),url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 const callback=new URL("/auth/callback",request.url).toString();
 url.searchParams.set("client_id",env.GOOGLE_CLIENT_ID);url.searchParams.set("redirect_uri",callback);url.searchParams.set("response_type","code");url.searchParams.set("scope","openid email profile");url.searchParams.set("state",state);url.searchParams.set("nonce",nonce);url.searchParams.set("prompt","select_account");
 return new Response(null,{status:302,headers:{"Location":url.toString(),"Set-Cookie":[`cv_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=600`,`cv_oauth_nonce=${nonce}; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=600`].join(", "),"Cache-Control":"no-store"}});
};
