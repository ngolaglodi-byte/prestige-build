// lib/deploy/vercelClient.ts

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // optionnel

export async function vercelRequest(path: string, options: any = {}) {
  const url = `https://api.vercel.com${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return res.json();
}
