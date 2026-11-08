export const onRequestGet=async({request,env}:any)=>{
 const m=(request.headers.get("Cookie")||"").match(/(?:^|; )cv_session=([^;]+)/);
 if(!m)return Response.json({authenticated:false},{status:401});
 return Response.json({authenticated:true,email:env.ADMIN_EMAIL},{headers:{"Cache-Control":"no-store"}});
};
