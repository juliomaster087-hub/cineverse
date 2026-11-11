import { deleteStoredObject, getMediaProviders } from "../../../_shared/media-storage";
interface Env { DB:any; MEDIA?:any; MEDIA_STORAGE_PROVIDERS?:string }
export const onRequestPatch=async({request,env,params}:any)=>{
 let body:any;try{body=await request.json()}catch{return Response.json({error:"JSON inválido."},{status:400})}
 const id=String(params.id),current=await env.DB.prepare("SELECT * FROM episodes WHERE id=?").bind(id).first();if(!current)return Response.json({error:"Episódio não encontrado."},{status:404});
 if(body.catalog_visible!==undefined)await env.DB.prepare("UPDATE episodes SET catalog_visible=?,updated_at=? WHERE id=?").bind(body.catalog_visible?1:0,Date.now(),id).run();
 if(body.mode!==undefined){const mode=body.mode;if(!["draft","published","scheduled"].includes(mode))return Response.json({error:"Status inválido."},{status:400});const releaseAt=mode==="scheduled"?new Date(body.scheduled_at||current.scheduled_at).getTime():null;if(mode==="scheduled"&&(!Number.isFinite(releaseAt)||releaseAt<=Date.now()))return Response.json({error:"Escolha uma data e horário futuros."},{status:400});await env.DB.prepare("UPDATE episodes SET status=?,scheduled_at=?,updated_at=? WHERE id=?").bind(mode,releaseAt,Date.now(),id).run();}
 return Response.json({success:true});
};
export const onRequestDelete=async({env,params}:any)=>{
 const id=String(params.id),episode=await env.DB.prepare("SELECT video_key,video_provider FROM episodes WHERE id=?").bind(id).first();
 if(episode?.video_key&&episode.video_provider){
  const provider=getMediaProviders(env).find((item)=>item.id===episode.video_provider);
  if(provider){try{await deleteStoredObject(provider,episode.video_key)}catch{}}
  await env.DB.prepare("UPDATE media_objects SET status='deleted' WHERE provider_id=? AND object_key=?").bind(episode.video_provider,episode.video_key).run();
 }else if(episode?.video_key&&env.MEDIA){await env.MEDIA.delete(episode.video_key);}
 await env.DB.prepare("DELETE FROM episodes WHERE id=?").bind(id).run();return Response.json({success:true});
};