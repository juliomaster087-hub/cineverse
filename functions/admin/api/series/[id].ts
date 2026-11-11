import { deleteStoredObject, getMediaProviders } from "../../../_shared/media-storage";
interface Env { DB:any; MEDIA?:any; MEDIA_STORAGE_PROVIDERS?:string }
export const onRequestPatch=async({request,env,params}:any)=>{
 let body:any;try{body=await request.json()}catch{return Response.json({error:"JSON inválido."},{status:400})}
 const id=String(params.id),exists=await env.DB.prepare("SELECT id FROM series WHERE id=?").bind(id).first();
 if(!exists)return Response.json({error:"Série não encontrada."},{status:404});
 if(body.catalog_visible!==undefined)await env.DB.prepare("UPDATE series SET catalog_visible=?,updated_at=? WHERE id=?").bind(body.catalog_visible?1:0,Date.now(),id).run();
 return Response.json({success:true});
};
export const onRequestDelete=async({env,params}:any)=>{
 const id=String(params.id);
 const episodes=await env.DB.prepare("SELECT video_key,video_provider FROM episodes WHERE series_id=?").bind(id).all();
 const providers=getMediaProviders(env);
 for(const episode of episodes.results||[]){
  if(episode.video_key&&episode.video_provider){
   const provider=providers.find((item)=>item.id===episode.video_provider);
   if(provider){try{await deleteStoredObject(provider,episode.video_key)}catch{}}
   await env.DB.prepare("UPDATE media_objects SET status='deleted' WHERE provider_id=? AND object_key=?").bind(episode.video_provider,episode.video_key).run();
  }else if(episode.video_key&&env.MEDIA){try{await env.MEDIA.delete(episode.video_key)}catch{}}
 }
 await env.DB.prepare("DELETE FROM episodes WHERE series_id=?").bind(id).run();
 await env.DB.prepare("DELETE FROM series WHERE id=?").bind(id).run();
 return Response.json({success:true});
};