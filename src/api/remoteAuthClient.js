/**
 * عميل مصادقة بعيد (PostgreSQL + JWT على خادمكم).
 * يُفعَّل عند تعيين VITE_WADAQ_API_URL.
 */
export function getApiBase() {
  const u = import.meta.env.VITE_WADAQ_API_URL;
  if (!u || typeof u !== "string") return "";
  return u.replace(/\/$/, "");
}

export function isRemoteAuthEnabled() {
  return Boolean(getApiBase());
}

async function parseJson(res) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return {};
  }
}

export async function remoteSignup(body) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function remoteLogin(body) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function remoteGoogle(body) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function remoteMe(accessToken) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function remotePatchMe(accessToken, body) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
