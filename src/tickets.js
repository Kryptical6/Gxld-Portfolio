// Ticket data layer.
//
// When Supabase env vars are present the app uses the real backend (shared
// tickets across devices, owner login, file release). When they are absent it
// falls back to per-browser localStorage so the site keeps working before/while
// you finish Supabase setup. Components only ever call the async functions
// below and never care which mode is active.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
export const isCloud = Boolean(supabase);

// Optional Cloudflare Turnstile spam protection. When a site key is configured
// (and we're in cloud mode), ticket creation routes through the create-ticket
// edge function, which verifies the captcha server-side.
export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
export const turnstileEnabled = Boolean(turnstileSiteKey) && isCloud;

// Owner code used only in localStorage fallback mode. In cloud mode the admin
// logs in with a real Supabase email + password instead.
const LEGACY_ADMIN_CODE = "GXLD-ADMIN-2026";

// Email notification on new ticket (Formspree-compatible). Fires in both modes.
const TICKET_NOTIFY_ENDPOINT = "https://formspree.io/f/xojzgjkd";

const notifyNewTicket = (ticket) => {
  if (!TICKET_NOTIFY_ENDPOINT) return;
  fetch(TICKET_NOTIFY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `New GXLD ticket ${ticket.code} from ${ticket.name}`,
      code: ticket.code,
      name: ticket.name,
      discord: ticket.discord,
      email: ticket.email,
      package: ticket.packageType,
      budget: ticket.budget,
      deadline: ticket.deadline,
      brief: ticket.brief,
      openedAt: ticket.createdAt,
    }),
  }).catch(() => {});
};

const DEFAULT_ADMIN_NOTE = "Thanks for opening a ticket. GXLD will review your brief and reply soon.";

// Normalize a database row (snake_case, joined replies) to the camelCase shape
// the UI uses.
const fromRow = (row) => {
  if (!row) return null;
  const rawReplies = row.replies || row.ticket_replies || [];
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    discord: row.discord,
    email: row.email || "",
    packageType: row.package_type,
    budget: row.budget || "",
    deadline: row.deadline || "",
    brief: row.brief,
    status: row.status,
    quote: row.quote || "",
    adminNote: row.admin_note || DEFAULT_ADMIN_NOTE,
    adminNoteAt: row.admin_note_at || row.created_at,
    delivery: row.delivery || null,
    releasedAt: row.released_at || null,
    internalNote: row.internal_note || "",
    archived: row.archived || false,
    statusLog: row.status_log || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replies: rawReplies
      .map((r) => ({ from: r.from_role || r.from, body: r.body, at: r.created_at || r.at }))
      .sort((a, b) => new Date(a.at) - new Date(b.at)),
  };
};

// Map camelCase UI changes to snake_case columns for admin updates.
const toRow = (changes) => {
  const map = {
    status: "status",
    quote: "quote",
    adminNote: "admin_note",
    adminNoteAt: "admin_note_at",
    delivery: "delivery",
    releasedAt: "released_at",
    internalNote: "internal_note",
    archived: "archived",
  };
  const out = {};
  Object.entries(changes).forEach(([key, value]) => {
    if (map[key]) out[map[key]] = value;
  });
  out.updated_at = new Date().toISOString();
  return out;
};

// --------------------------------------------------------------------------
// localStorage fallback helpers
// --------------------------------------------------------------------------
const TICKETS_KEY = "gxld-ticket-store";

const lsGetAll = () => {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY)) || [];
  } catch {
    return [];
  }
};

const lsSaveAll = (tickets) => localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));

const lsMakeCode = () => `GX-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const lsUpdate = (id, mutate) => {
  const tickets = lsGetAll();
  const next = tickets.map((ticket) => (ticket.id === id ? mutate(ticket) : ticket));
  lsSaveAll(next);
  return next.find((ticket) => ticket.id === id) || null;
};

// --------------------------------------------------------------------------
// Client-facing API
// --------------------------------------------------------------------------
export async function createTicket(form, captchaToken) {
  if (turnstileEnabled) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ form, token: captchaToken }),
    });
    if (!res.ok) throw new Error("Ticket creation failed");
    const ticket = fromRow(await res.json());
    notifyNewTicket(ticket);
    return ticket;
  }

  if (isCloud) {
    const { data, error } = await supabase.rpc("create_ticket", {
      p_name: form.name,
      p_discord: form.discord,
      p_email: form.email || "",
      p_package: form.packageType,
      p_budget: form.budget || "",
      p_deadline: form.deadline || "",
      p_brief: form.brief,
    });
    if (error) throw error;
    const ticket = fromRow(data);
    notifyNewTicket(ticket);
    return ticket;
  }

  const now = new Date().toISOString();
  const ticket = {
    ...form,
    id: crypto.randomUUID(),
    code: lsMakeCode(),
    status: "Open",
    createdAt: now,
    updatedAt: now,
    adminNote: DEFAULT_ADMIN_NOTE,
    adminNoteAt: now,
    delivery: null,
    releasedAt: null,
    internalNote: "",
    archived: false,
    statusLog: [{ status: "Open", at: now }],
    replies: [],
  };
  lsSaveAll([ticket, ...lsGetAll()]);
  notifyNewTicket(ticket);
  return ticket;
}

export async function getTicketByCode(code) {
  const trimmed = code.trim();
  if (isCloud) {
    const { data, error } = await supabase.rpc("get_ticket", { p_code: trimmed });
    if (error) throw error;
    return fromRow(data);
  }
  const found = lsGetAll().find((ticket) => ticket.code.toLowerCase() === trimmed.toLowerCase());
  return found || null;
}

export async function addClientReply(code, body) {
  const text = body.trim();
  if (!text) return getTicketByCode(code);
  if (isCloud) {
    const { data, error } = await supabase.rpc("add_client_reply", { p_code: code, p_body: text });
    if (error) throw error;
    return fromRow(data);
  }
  const all = lsGetAll();
  const target = all.find((ticket) => ticket.code.toLowerCase() === code.trim().toLowerCase());
  if (!target) return null;
  const updated = lsUpdate(target.id, (ticket) => ({
    ...ticket,
    updatedAt: new Date().toISOString(),
    replies: [...ticket.replies, { from: "Client", body: text, at: new Date().toISOString() }],
  }));
  return updated;
}

// --------------------------------------------------------------------------
// Admin API
// --------------------------------------------------------------------------

// In cloud mode `email` + `password` are real credentials. In fallback mode the
// password field carries the legacy owner code (email is ignored).
export async function adminSignIn(email, password) {
  if (isCloud) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { ok: !error, error: error?.message };
  }
  return { ok: password === LEGACY_ADMIN_CODE, error: null };
}

export async function adminSignOut() {
  if (isCloud) await supabase.auth.signOut();
}

export async function getAdminSession() {
  if (!isCloud) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export async function listTickets() {
  if (isCloud) {
    const { data, error } = await supabase
      .from("tickets")
      .select("*, ticket_replies(*)")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map(fromRow);
  }
  return lsGetAll()
    .map((ticket) => ({ ...ticket }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function updateTicket(id, changes) {
  if (isCloud) {
    const { error } = await supabase.from("tickets").update(toRow(changes)).eq("id", id);
    if (error) throw error;
    return;
  }
  const now = new Date().toISOString();
  lsUpdate(id, (ticket) => {
    const statusChanged = changes.status && changes.status !== ticket.status;
    const statusLog = statusChanged
      ? [...(ticket.statusLog || []), { status: changes.status, at: now }]
      : ticket.statusLog || [];
    return { ...ticket, ...changes, statusLog, updatedAt: now };
  });
}

export async function addAdminReply(id, body) {
  const text = body.trim();
  if (!text) return;
  if (isCloud) {
    const { error } = await supabase.from("ticket_replies").insert({ ticket_id: id, from_role: "GXLD", body: text });
    if (error) throw error;
    await supabase.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", id);
    return;
  }
  lsUpdate(id, (ticket) => ({
    ...ticket,
    updatedAt: new Date().toISOString(),
    replies: [...ticket.replies, { from: "GXLD", body: text, at: new Date().toISOString() }],
  }));
}

// Live updates for the admin desk. Cloud mode uses Supabase realtime; fallback
// mode polls localStorage periodically. Returns an unsubscribe function.
export function subscribeTickets(onChange) {
  if (isCloud) {
    const channel = supabase
      .channel("tickets-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => onChange())
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_replies" }, () => onChange())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
  const interval = setInterval(onChange, 8000);
  return () => clearInterval(interval);
}

export async function deleteTicket(id) {
  if (isCloud) {
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  lsSaveAll(lsGetAll().filter((ticket) => ticket.id !== id));
}
