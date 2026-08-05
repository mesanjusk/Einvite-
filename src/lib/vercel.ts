const VERCEL_API = "https://api.vercel.com";

export function isVercelConfigured() {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

function authHeaders() {
  return { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` };
}

function teamQuery() {
  return process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
}

export async function addCustomDomain(domain: string) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const response = await fetch(
    `${VERCEL_API}/v10/projects/${projectId}/domains${teamQuery()}`,
    {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ name: domain }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Failed to add domain in Vercel");
  }
  return data as { name: string; verified: boolean };
}

export async function removeCustomDomain(domain: string) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const response = await fetch(
    `${VERCEL_API}/v9/projects/${projectId}/domains/${domain}${teamQuery()}`,
    { method: "DELETE", headers: authHeaders() },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message ?? "Failed to remove domain in Vercel");
  }
}
