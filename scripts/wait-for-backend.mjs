#!/usr/bin/env node
const base =
  process.env.API_HEALTH_URL ||
  "http://127.0.0.1:8000/make-server-cfb78916/health";
const timeoutMs = Number(process.env.WAIT_TIMEOUT_MS || 120_000);
const started = Date.now();

async function ping() {
  const res = await fetch(base);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body?.status !== "ok") throw new Error(JSON.stringify(body));
}

while (Date.now() - started < timeoutMs) {
  try {
    await ping();
    console.log(`Backend OK: ${base}`);
    process.exit(0);
  } catch {
    await new Promise((r) => setTimeout(r, 1500));
  }
}

console.error(`Timeout waiting for ${base}`);
process.exit(1);
