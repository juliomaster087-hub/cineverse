interface Env { DB:any }
export const onRequestPatch=async({request,env,params}:any)=>{
 let body:any;try{body=await request.json()}catch{return Response.json({error:"JSON inválido."},{status:400})}
 const id=String(params.id),exists=await env.DB.prepare("SELECT id FROM series WHERE id=?").bind(id).first();
 if(!exists)return Response.json({error:"Série não encontrada."},{status:404});
 if(body.catalog_visible!==undefined) await env.DB.prepare("UPDATE series SET catalog_visible=?,updated_at=? WHERE id=?").bind(body.catalog_visible?1:0,Date.now(),id).run();
 return Response.json({success:true});
};
export const onRequestDelete=async({env,params}:any)=>{
 await env.DB.prepare("DELETE FROM episodes WHERE series_id=?").bind(String(params.id)).run();
 await env.DB.prepare("DELETE FROM series WHERE id=?").bind(String(params.id)).run();
 return Response.json({success:true});
};
