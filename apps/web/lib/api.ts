const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getXsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function ensureCsrf(): Promise<void> {
  if (getXsrfToken()) return;
  await fetch(`${BASE}/sanctum/csrf-cookie`, { credentials: "include" });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    await ensureCsrf().catch(() => {});
  }

  const xsrf = getXsrfToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? (undefined as T) : res.json();
}
