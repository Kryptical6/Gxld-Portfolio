import { describe, expect, it } from "vitest";
import {
  addAdminReply,
  addClientReply,
  adminSignIn,
  createTicket,
  deleteTicket,
  getTicketByCode,
  isCloud,
  listTickets,
  updateTicket,
} from "./tickets";

// These tests exercise the localStorage fallback path (no Supabase env vars in
// the test environment), which is the logic we can run without a live backend.

const sampleForm = {
  name: "Test User",
  discord: "@test",
  email: "",
  packageType: "UI + Import",
  budget: "$40",
  deadline: "1 week",
  brief: "A shop UI please.",
};

describe("ticket data layer (fallback mode)", () => {
  it("runs in fallback mode under test", () => {
    expect(isCloud).toBe(false);
  });

  it("creates a ticket with a code, Open status, and a seeded status log", async () => {
    const ticket = await createTicket(sampleForm);
    expect(ticket.code).toMatch(/^GX-/);
    expect(ticket.status).toBe("Open");
    expect(ticket.statusLog).toHaveLength(1);
    expect(ticket.statusLog[0].status).toBe("Open");
    expect(ticket.replies).toEqual([]);
  });

  it("looks up a ticket by code, case-insensitively", async () => {
    const created = await createTicket(sampleForm);
    const found = await getTicketByCode(created.code.toLowerCase());
    expect(found?.id).toBe(created.id);
    expect(await getTicketByCode("GX-DOESNOTEXIST")).toBeNull();
  });

  it("appends a client reply", async () => {
    const created = await createTicket(sampleForm);
    const updated = await addClientReply(created.code, "Any update?");
    expect(updated.replies.at(-1)).toMatchObject({ from: "Client", body: "Any update?" });
  });

  it("appends a status-log entry when status changes", async () => {
    const created = await createTicket(sampleForm);
    await updateTicket(created.id, { status: "Quoted" });
    const [ticket] = await listTickets();
    expect(ticket.status).toBe("Quoted");
    expect(ticket.statusLog.map((entry) => entry.status)).toEqual(["Open", "Quoted"]);
  });

  it("stores an admin reply and round-trips the internal note field", async () => {
    const created = await createTicket(sampleForm);
    await addAdminReply(created.id, "On it!");
    await updateTicket(created.id, { internalNote: "private" });
    const fetched = await getTicketByCode(created.code);
    expect(fetched.replies.some((r) => r.from === "GXLD" && r.body === "On it!")).toBe(true);
    expect(fetched.internalNote).toBe("private");
  });

  it("deletes a ticket", async () => {
    const created = await createTicket(sampleForm);
    await deleteTicket(created.id);
    expect(await getTicketByCode(created.code)).toBeNull();
  });

  it("accepts the legacy owner code in fallback admin sign-in", async () => {
    expect((await adminSignIn("", "GXLD-ADMIN-2026")).ok).toBe(true);
    expect((await adminSignIn("", "wrong")).ok).toBe(false);
  });
});
