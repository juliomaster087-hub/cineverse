const ADMIN_EMAIL = "likasousa2024@gmail.com";
export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const email = request.headers.get("cf-access-authenticated-user-email")?.trim().toLowerCase();
  if (email !== ADMIN_EMAIL) {
    return Response.json({ error: "Acesso negado. Entre pelo Cloudflare Access com o e-mail autorizado." }, { status: 403 });
  }
  return next();
};