import { describe, expect, it } from "vitest";
import { MealTicket, generateMonthlyTickets, getNextMealIndexBase } from "./mealTicketRecord";
import { AppUser } from "../components/admin/UserManagementView";

const MONTH = "2026-05";
const agentUser: AppUser = {
  id: "agent-1",
  firstName: "Pierre",
  lastName: "Test",
  email: "pierre@test.fr",
  position: "Agent",
  service: "Maintenance",
  domain: "Technique",
  location: "Site Lyon",
  category: "Agent",
  role: "ROLE_AGENT",
  inm: 400,
  createdAt: "2025-01-01T00:00:00Z",
  createdBy: "Système",
};

function baseTicket(id: string, mealIndex: number): MealTicket {
  return {
    id,
    ticketNumber: "TR-202605-00001",
    userId: "agent-1",
    agentName: "Pierre Test",
    agentEmail: "pierre@test.fr",
    service: "Maintenance",
    domain: "Technique",
    location: "Site Lyon",
    month: MONTH,
    mealCount: 1,
    mealIndex,
    qrToken: "TOK",
    status: "active",
    generatedAt: "2026-05-01T00:00:00Z",
    generatedBy: "Admin",
  };
}

describe("getNextMealIndexBase", () => {
  it("après deux repas mal numérotés n°1, la base est 2 (prochains 3 et 4)", () => {
    const tickets = [baseTicket("old-a", 1), baseTicket("old-b", 1)];
    expect(getNextMealIndexBase(tickets, "agent-1", MONTH)).toBe(2);
  });

  it("séquence normale 1..22 → base 22", () => {
    const tickets = Array.from({ length: 22 }, (_, i) => baseTicket(`t-${i}`, i + 1));
    expect(getNextMealIndexBase(tickets, "agent-1", MONTH)).toBe(22);
  });
});

describe("generateMonthlyTickets", () => {
  it("n’attribue plus un second repas n°1 si deux doublons existent déjà", () => {
    const existing: MealTicket[] = [baseTicket("old-a", 1), baseTicket("old-b", 1)];
    const existingIds = new Set(existing.map((t) => t.id));

    const { tickets, created } = generateMonthlyTickets({
      month: MONTH,
      agents: [agentUser],
      existingTickets: existing,
      mealsPerPerson: 4,
      generatedBy: "Admin",
      filters: { service: "Maintenance", domain: "all", location: "all" },
      selectedUserIds: ["agent-1"],
      locationCatalog: [{ id: "2", name: "Site Lyon", regionCode: "13" }],
    });

    expect(created).toBe(2);
    const newTickets = tickets.filter((t) => !existingIds.has(t.id));
    expect(newTickets.map((t) => t.mealIndex).sort((a, b) => a! - b!)).toEqual([3, 4]);
  });
});
