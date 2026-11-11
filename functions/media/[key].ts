import { getMediaProviders, presignObject, reserveMonthlyOperation } from "../_shared/media-storage";

interface Env { DB:any; MEDIA?:any; MEDIA_STORAGE_PROVIDERS?:string }

export const onRequest = async ({ request, env, params }: any) => {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const key = String(params.key || "");
  if (!/^[a-f0-9-]{36}\.(mp4|webm|mov)$/.test(key)) return new Response("Not found", { status: 404 });

  const row = env.DB
    ? await env.DB.prepare("SELECT provider_id,object_key,content_type,status FROM media_objects WHERE object_key=? AND status='ready'").bind(key).first()
    : null;

  if (row) {
    const provider = getMediaProviders(env).find((item) => item.id === row.provider_id);
    if (!provider) return new Response("Video storage unavailable", { status: 503 });
    const quota = await reserveMonthlyOperation(env.DB, provider, "read");
    if (!quota.allowed) return new Response("Monthly free playback request limit reached", { status: 429 });

    try {
      const signedUrl = await presignObject(provider, request.method as "GET" | "HEAD", row.object_key, 300);
      const upstreamHeaders = new Headers();
      const range = request.headers.get("Range");
      if (range && request.method === "GET") upstreamHeaders.set("Range", range);
      const upstream = await fetch(signedUrl, { method: request.method, headers: upstreamHeaders });
      if (!upstream.ok && upstream.status !== 206) return new Response("Video unavailable", { status: upstream.status === 404 ? 404 : 502 });
      const headers = new Headers();
      for (const name of ["content-type","content-length","content-range","accept-ranges","etag","last-modified"]) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
      }
      headers.set("Cache-Control", "private, no-store");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers });
    } catch {
      return new Response("Video unavailable", { status: 502 });
    }
  }

  // Compatibility for legacy videos already stored in an R2 binding.
  if (!env.MEDIA) return new Response("Not found", { status: 404 });
  const rangeHeader = request.headers.get("Range");
  let object: any, status = 200, rangeStart = 0, rangeEnd = -1;
  try {
    if (rangeHeader && request.method === "GET") {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!match) return new Response(null, { status: 416 });
      const head = await env.MEDIA.head(key);
      if (!head) return new Response("Not found", { status: 404 });
      rangeStart = match[1] ? Number(match[1]) : Math.max(0, head.size - Number(match[2] || 0));
      rangeEnd = match[2] && match[1] ? Math.min(Number(match[2]), head.size - 1) : head.size - 1;
      if (rangeStart > rangeEnd || rangeStart >= head.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${head.size}` } });
      object = await env.MEDIA.get(key, { range: { offset: rangeStart, length: rangeEnd - rangeStart + 1 } });
      status = 206;
    } else object = await env.MEDIA.get(key);
  } catch {
    return new Response("Unable to read video", { status: 500 });
  }
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (status === 206) {
    headers.set("Content-Range", `bytes ${rangeStart}-${rangeEnd}/${object.size}`);
    headers.set("Content-Length", String(rangeEnd - rangeStart + 1));
  } else headers.set("Content-Length", String(object.size));
  return new Response(request.method === "HEAD" ? null : object.body, { status, headers });
};
