interface Env { DB:any; MEDIA?:any }
export const onRequestPost=async({request,env}:any)=>{
 let body:any;try{body=await request.json()}catch{return Response.json({error:"JSON inválido."},{status:400})}
 const {series_id,title}=body,season=Math.max(1,Number(body.season_number)||1),number=Math.max(1,Number(body.episode_number)||1);
 if(!series_id||!String(title||"").trim())return Response.json({error:"Selecione uma série e informe o título."},{status:400});
 const videoKey=typeof body.video_key==="string"?body.video_key:"";
 const youtube=String(body.youtube_url||"").trim();
 if(Boolean(videoKey)===Boolean(youtube))return Response.json({error:"Escolha somente uma fonte: YouTube ou arquivo enviado."},{status:400});
 if(videoKey){
  if(!/^[a-f0-9-]{36}\.(mp4|webm|mov)$/.test(videoKey)||!env.MEDIA)return Response.json({error:"Armazenamento de vídeos indisponível."},{status:503});
  const stored=await env.MEDIA.head(videoKey);if(!stored)return Response.json({error:"O vídeo enviado não foi encontrado."},{status:404});
 }
 if(youtube){let url:URL;try{url=new URL(youtube)}catch{return Response.json({error:"Informe um link válido do YouTube."},{status:400})}
  if(!["youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtube-nocookie.com"].includes(url.hostname))return Response.json({error:"Use um link do YouTube."},{status:400});}
 const exists=await env.DB.prepare("SELECT id FROM series WHERE id=?").bind(series_id).first();if(!exists)return Response.json({error:"Série não encontrada."},{status:404});
 const mode=body.mode==="scheduled"?"scheduled":body.mode==="draft"?"draft":"published";
 const releaseAt=mode==="scheduled"?Number(body.scheduled_at):null;
 if(mode==="scheduled"&&(!Number.isFinite(releaseAt)||releaseAt<=Date.now()))return Response.json({error:"Escolha uma data e horário futuros."},{status:400});
 const now=Date.now(),id=crypto.randomUUID();
 try{await env.DB.prepare("INSERT INTO episodes (id,series_id,season_number,episode_number,title,synopsis,youtube_url,video_key,status,scheduled_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,series_id,season,number,String(title).trim(),String(body.synopsis||"").trim(),youtube,videoKey||null,mode,releaseAt,now,now).run()}
 catch{return Response.json({error:"Esse número de episódio já existe nessa temporada."},{status:409})}
 return Response.json({success:true,id},{status:201});
};