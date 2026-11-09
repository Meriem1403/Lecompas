import { describe, expect, it } from "vitest";
import {
  SESSION_ABSOLUTE_MS,
  SESSION_IDLE_MS,
  isStoredSessionExpired,
} from "./authSession";

describe("isStoredSessionExpired", () => {
  const now = 1_700_000_000_000;

  it("refuse une session sans date", () => {
    expect(isStoredSessionExpired(Number.NaN, now, now)).toBe(true);
    expect(isStoredSessionExpired(0, 0, now)).toBe(true);
  });

  it("accepte une session récente", () => {
    expect(isStoredSessionExpired(now - 60_000, now - 60_000, now)).toBe(false);
  });

  it("expire après 30 minutes sans activité", () => {
    expect(
      isStoredSessionExpired(now - SESSION_IDLE_MS - 1, now - SESSION_IDLE_MS - 1, now),
    ).toBe(true);
  });

  it("expire au bout de 8 heures même si l'activité continue", () => {
    expect(
      isStoredSessionExpired(now - SESSION_ABSOLUTE_MS - 1, now, now),
    ).toBe(true);
  });
});
