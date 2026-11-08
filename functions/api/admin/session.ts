export const onRequestGet = async ({ request }: { request: Request }) => {
  const email = request.headers.get("cf-access-authenticated-user-email")?.trim().toLowerCase();
  if (email !== "likasousa2024@gmail.com") return Response.json({ authenticated: false }, { status: 403 });
  return Response.json({ authenticated: true, email });
};