export const onRequestGet = async ({request,env}:any) => {
 const email=request.headers.get("cf-access-authenticated-user-email")?.trim().toLowerCase();
 if(!env.ADMIN_EMAIL || email!==String(env.ADMIN_EMAIL).trim().toLowerCase()) return Response.json({authenticated:false},{status:403});
 return Response.json({authenticated:true,email});
};
