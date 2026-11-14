export type MediaProvider = {
  id: string;
  type: "r2" | "tigris";
  label: string;
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  freeLimitBytes: number;
};

const GIB = 1024 ** 3;
const FREE_LIMITS: Record<string, number> = {
  r2: 10_000_000_000,
  tigris: 5 * GIB,
};

const enc = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    "%" + char.charCodeAt(0).toString(16).toUpperCase()
  );

const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes)).map((value) => value.toString(16).padStart(2, "0")).join("");

async function sha256(value: string) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function hmac(key: ArrayBuffer | Uint8Array, value: string) {
  const raw = key instanceof Uint8Array ? key : new Uint8Array(key);
  const imported = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", imported, new TextEncoder().encode(value)));
}

export function getMediaProviders(env: any): MediaProvider[] {
  if (!env.MEDIA_STORAGE_PROVIDERS) return [];
  try {
    const parsed = JSON.parse(env.MEDIA_STORAGE_PROVIDERS);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.flatMap((item: any) => {
      try {
        const type = String(item.type || "");
        const cap = FREE_LIMITS[type];
        const id = String(item.id || type);
        if (!cap || seen.has(type) || !/^[a-z0-9-]{2,32}$/.test(id)) return [];
        const endpoint = new URL(String(item.endpoint || ""));
        if (endpoint.protocol !== "https:") return [];
        const bucket = String(item.bucket || "");
        const accessKeyId = String(item.accessKeyId || "");
        const secretAccessKey = String(item.secretAccessKey || "");
        if (!/^[a-z0-9][a-z0-9.-]{1,62}$/.test(bucket) || !accessKeyId || !secretAccessKey) return [];
        seen.add(type);
        const requestedLimit = Number(item.freeLimitBytes);
        const freeLimitBytes = Number.isFinite(requestedLimit) && requestedLimit > 0
          ? Math.min(cap, requestedLimit)
          : cap;
        return [{
          id,
          type,
          label: String(item.label || (type === "r2" ? "Cloudflare R2" : "Tigris")),
          endpoint: endpoint.origin + endpoint.pathname.replace(/\/+$/, ""),
          bucket,
          region: String(item.region || "auto"),
          accessKeyId,
          secretAccessKey,
          freeLimitBytes,
        }];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

export function providerRequestLimit(provider: MediaProvider, kind: "read" | "write") {
  if (provider.type === "r2") return kind === "read" ? 9_000_000 : 900_000;
  return kind === "read" ? 90_000 : 9_000;
}

export async function reserveMonthlyOperation(db: any, provider: MediaProvider, kind: "read" | "write") {
  const month = new Date().toISOString().slice(0, 7);
  const column = kind === "read" ? "read_requests" : "write_requests";
  const limit = providerRequestLimit(provider, kind);
  await db.prepare(
    "INSERT OR IGNORE INTO media_provider_usage (provider_id,month_key,read_requests,write_requests) VALUES (?,?,0,0)"
  ).bind(provider.id, month).run();
  const row = await db.prepare(
    `UPDATE media_provider_usage SET ${column}=${column}+1 WHERE provider_id=? AND month_key=? AND ${column}<? RETURNING ${column} AS used`
  ).bind(provider.id, month, limit).first();
  return { allowed: !!row, used: Number(row?.used || limit), limit, month };
}

export async function presignObject(provider: MediaProvider, method: "PUT" | "GET" | "HEAD" | "DELETE", key: string, expires = 900) {
  const url = new URL(provider.endpoint);
  const basePath = url.pathname.replace(/\/+$/, "");
  const objectPath = key.split("/").map(enc).join("/");

  // New Tigris buckets require virtual-hosted-style addressing. Path-style
  // URLs (endpoint/bucket/key) fail for buckets created after Feb 19, 2025.
  // Keep the bucket hostname in the SigV4 canonical host as well.
  if (provider.type === "tigris") {
    url.hostname = provider.bucket + "." + url.hostname;
    url.pathname = basePath + "/" + objectPath;
  } else {
    url.pathname = basePath + "/" + enc(provider.bucket) + "/" + objectPath;
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = dateStamp + "/" + provider.region + "/s3/aws4_request";
  const params: Array<[string, string]> = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", provider.accessKeyId + "/" + scope],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expires)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const canonicalQuery = params
    .map(([name, value]) => [enc(name), enc(value)] as [string, string])
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => name + "=" + value)
    .join("&");
  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQuery,
    "host:" + url.host + "\n",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256(canonicalRequest),
  ].join("\n");

  const kDate = await hmac(new TextEncoder().encode("AWS4" + provider.secretAccessKey), dateStamp);
  const kRegion = await hmac(kDate, provider.region);
  const kService = await hmac(kRegion, "s3");
  const kSigning = await hmac(kService, "aws4_request");
  const signature = hex(await hmac(kSigning, stringToSign));
  url.search = canonicalQuery + "&X-Amz-Signature=" + signature;
  return url.toString();
}

export function publicObjectUrl(key: string) {
  return "/media/" + encodeURIComponent(key);
}

export async function deleteStoredObject(provider: MediaProvider, key: string) {
  const url = await presignObject(provider, "DELETE", key, 300);
  const response = await fetch(url, { method: "DELETE" });
  return response.ok || response.status === 404;
}
