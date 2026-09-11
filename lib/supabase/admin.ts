import "server-only";

export type SupabaseRestError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function getConfig() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!baseUrl || !secretKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return { baseUrl, secretKey };
}

export async function supabaseAdminFetch(path: string, init: RequestInit = {}) {
  const { baseUrl, secretKey } = getConfig();

  const headers = new Headers(init.headers);
  headers.set("apikey", secretKey);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${baseUrl}/rest/v1/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function readSupabaseError(response: Response): Promise<SupabaseRestError> {
  try {
    return (await response.json()) as SupabaseRestError;
  } catch {
    return { message: `Supabase request failed with status ${response.status}.` };
  }
}


export async function supabaseStorageFetch(
  path: string,
  accessToken: string,
  init: RequestInit = {},
) {
  const { baseUrl, secretKey } = getConfig();
  const headers = new Headers(init.headers);

  headers.set("apikey", secretKey);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(`${baseUrl}/storage/v1/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export function getSupabasePublicStorageUrl(bucket: string, objectPath: string) {
  const { baseUrl } = getConfig();
  const safeBucket = encodeURIComponent(bucket);
  const safePath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/storage/v1/object/public/${safeBucket}/${safePath}`;
}
