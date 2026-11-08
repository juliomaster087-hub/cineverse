interface Env { DB: any }
export const onRequestPost = async ({request,env}:any) => {
 let body:any; try{body=await request.json()}catch{return Response.json({error:"JSON inválido."},{status:400})}
 const title=String(body.title||"").trim(); if(!title)return Response.json({error:"Informe o nome da série."},{status:400});
 const now=Date.now(), id=crypto.randomUUID();
 await env.DB.prepare("INSERT INTO series (id,title,synopsis,genre,year,poster_url,featured,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,title,String(body.synopsis||"").trim(),String(body.genre||"").trim(),Number(body.year)||null,String(body.poster_url||"").trim(),body.featured?1:0,now,now).run();
 return Response.json({success:true,id},{status:201});
};