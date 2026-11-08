interface Env { MEDIA?:any }
export const onRequestGet=async({request,env,params}:any)=>{
 const key=String(params.key||"");
 if(!/^[a-f0-9-]{36}\.(mp4|webm|mov)$/.test(key))return new Response("Not found",{status:404});
 if(!env.MEDIA)return new Response("Video storage unavailable",{status:503});
 const rangeHeader=request.headers.get("Range");
 let object:any,status=200,rangeStart=0,rangeEnd=-1;
 try{
  if(rangeHeader){
   const match=/^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
   if(!match)return new Response(null,{status:416});
   const head=await env.MEDIA.head(key);if(!head)return new Response("Not found",{status:404});
   rangeStart=match[1]?Number(match[1]):Math.max(0,head.size-Number(match[2]||0));
   rangeEnd=match[2]&&match[1]?Math.min(Number(match[2]),head.size-1):head.size-1;
   if(rangeStart>rangeEnd||rangeStart>=head.size)return new Response(null,{status:416,headers:{"Content-Range":`bytes */${head.size}`}});
   object=await env.MEDIA.get(key,{range:{offset:rangeStart,length:rangeEnd-rangeStart+1}});status=206;
  }else object=await env.MEDIA.get(key);
 }catch{return new Response("Unable to read video",{status:500})}
 if(!object)return new Response("Not found",{status:404});
 const headers=new Headers();object.writeHttpMetadata(headers);headers.set("Accept-Ranges","bytes");headers.set("ETag",object.httpEtag);headers.set("Cache-Control","public, max-age=31536000, immutable");
 if(status===206){headers.set("Content-Range",`bytes ${rangeStart}-${rangeEnd}/${object.size}`);headers.set("Content-Length",String(rangeEnd-rangeStart+1));}
 else headers.set("Content-Length",String(object.size));
 return new Response(object.body,{status,headers});
};