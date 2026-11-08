interface Env { MEDIA?:any }
const MAX_BYTES=90*1024*1024;
export const onRequestPost=async({request,env}:any)=>{
 if(!env.MEDIA)return Response.json({error:"Armazenamento de vídeos ainda não foi ativado neste projeto."},{status:503});
 let form:FormData;try{form=await request.formData()}catch{return Response.json({error:"Envio inválido."},{status:400})}
 const file=form.get("video");
 if(!(file instanceof File))return Response.json({error:"Selecione um arquivo de vídeo."},{status:400});
 const types:Record<string,string>={"video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
 const ext=types[file.type];if(!ext)return Response.json({error:"Formato não aceito. Envie MP4, WebM ou MOV."},{status:415});
 if(file.size<=0||file.size>MAX_BYTES)return Response.json({error:"O vídeo deve ter até 90 MB."},{status:413});
 const key=`${crypto.randomUUID()}.${ext}`;
 try{await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"},customMetadata:{originalName:file.name.slice(0,180)}})}
 catch{return Response.json({error:"Não foi possível armazenar o vídeo. Tente novamente."},{status:500})}
 return Response.json({success:true,video_key:key,size:file.size},{status:201});
};