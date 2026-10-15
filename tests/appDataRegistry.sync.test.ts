import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";

function extractBackendRegistryKeys(): string[] {
  const src = readFileSync(join(process.cwd(), "backend/server.js"), "utf8");
  const start = src.indexOf("const APP_DATA_REGISTRY = {");
  if (start < 0) throw new Error("APP_DATA_REGISTRY introuvable");
  const end = src.indexOf("\n};", start);
  const block = src.slice(start, end);
  return [...block.matchAll(/^  (\w+):/gm)].map((m) => m[1]).sort();
}

describe("alignement persistance app-data", () => {
  it("expose les mêmes clés côté front et backend", () => {
    const front = Object.values(APP_DATA_KEYS).sort();
    const back = extractBackendRegistryKeys();
    expect(front).toEqual(back);
  });
});
