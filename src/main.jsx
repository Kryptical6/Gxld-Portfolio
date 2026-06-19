import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Gem,
  Inbox,
  Layers3,
  LayoutGrid,
  LogIn,
  Maximize2,
  MessageCircle,
  Palette,
  Play,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import "./styles.css";

const DISCORD_USER_ID = "<@1188805446455271426>";
const ADMIN_ACCESS_CODE = "GXLD-ADMIN-2026";
const TICKETS_KEY = "gxld-ticket-store";

const work = [
  {
    title: "Futuristic Anime UI",
    tag: "Figma + Roblox Import",
    image: "/assets/futuristic-anime.jpg",
    type: "Anime",
    tone: "cyan",
    featured: true,
  },
  {
    title: "Ancient Book Interface",
    tag: "Quest UI / Inventory",
    image: "/assets/ancient-book.jpg",
    type: "Fantasy",
    tone: "gold",
    featured: true,
  },
  {
    title: "Frost Anime HUD",
    tag: "Game UI / Polish Pass",
    image: "/assets/frost-ui.jpg",
    type: "Frost",
    tone: "blue",
    featured: true,
  },
  {
    title: "Neon Sci-Fi System",
    tag: "Shop / Panels / Import",
    image: "/assets/neon-scifi.jpg",
    type: "Sci-Fi",
    tone: "violet",
    featured: true,
  },
  {
    title: "Western UI Pack",
    tag: "Roblox Game UI",
    image: "/assets/western-ui.jpg",
    type: "Western",
    tone: "amber",
  },
  {
    title: "Minimal Anime Suite",
    tag: "Frames / Buttons / Icons",
    image: "/assets/minimal-anime.jpg",
    type: "Clean",
    tone: "rose",
  },
  {
    title: "Neon Anime UI",
    tag: "Menu / HUD System",
    image: "/assets/neon-anime.jpg",
    type: "Anime",
    tone: "violet",
  },
  {
    title: "Clothing Inventory",
    tag: "Inventory UX",
    image: "/assets/clothe-inventory.jpg",
    type: "Inventory",
    tone: "green",
  },
  {
    title: "Currency Tracker",
    tag: "Economy HUD",
    image: "/assets/currency-tracker.jpg",
    type: "Utility",
    tone: "gold",
  },
  {
    title: "Codes Panel",
    tag: "Modal UI",
    image: "/assets/codes-panel.jpg",
    type: "Utility",
    tone: "cyan",
  },
];

const packages = [
  {
    name: "Import Only",
    price: "$10",
    robux: "R$3.5k per frame",
    note: "For finished designs that need clean Roblox Studio implementation.",
    features: ["Full import", "Responsive scaling", "Original files included", "Style matched exactly"],
  },
  {
    name: "UI + Import",
    price: "$20",
    robux: "R$7.5k per frame",
    note: "Most popular for polished game menus, shops, inventories, and HUDs.",
    features: ["Custom UI design", "Full Roblox import", "Daily progress updates", "All editable source files"],
    featured: true,
  },
  {
    name: "UI Only",
    price: "$15",
    robux: "R$5k per frame",
    note: "Figma-ready UI frames for teams that already handle importing.",
    features: ["Custom frame design", "Component organization", "Export-ready assets", "Daily progress updates"],
  },
];

const faqs = [
  ["How long does a commission take?", "Usually 2 days to 2 weeks depending on how many frames, revisions, and import work are needed."],
  ["What does importing mean?", "Turning the UI into Roblox Studio elements, scaling it correctly, and preparing the frame so it works in-game."],
  ["Can you match a specific style?", "Yes. Send references, moodboards, or screenshots and the design can be matched while still feeling original."],
  ["Do I get the original files?", "Yes. Finished work includes export assets and originals so your team can keep editing later."],
];

const getStoredTickets = () => {
  try {
    const stored = localStorage.getItem(TICKETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveTickets = (tickets) => {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
};

const makeTicketCode = () => {
  const chunk = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GX-${chunk}`;
};

function App() {
  const [activePreview, setActivePreview] = useState(null);
  const [showAllWork, setShowAllWork] = useState(false);
  const [contactMode, setContactMode] = useState(null);
  const [tickets, setTickets] = useState(getStoredTickets);

  const updateTickets = (nextTickets) => {
    setTickets(nextTickets);
    saveTickets(nextTickets);
  };

  return (
    <main className="site-shell">
      <div className="beam beam-one" aria-hidden="true" />
      <div className="beam beam-two" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <Nav onContact={() => setContactMode("choice")} />
      <Hero onContact={() => setContactMode("choice")} onPreview={() => setActivePreview(work[0])} />
      <Showcase />
      <Gallery
        activeAll={showAllWork}
        onShowAll={() => setShowAllWork(true)}
        onBack={() => setShowAllWork(false)}
        onPreview={setActivePreview}
      />
      <Pricing onContact={() => setContactMode("choice")} />
      <Process />
      <Faq onContact={() => setContactMode("choice")} />
      {activePreview && <PreviewModal item={activePreview} onClose={() => setActivePreview(null)} />}
      {contactMode && (
        <ContactModal
          mode={contactMode}
          setMode={setContactMode}
          tickets={tickets}
          updateTickets={updateTickets}
          onClose={() => setContactMode(null)}
        />
      )}
    </main>
  );
}

function Nav({ onContact }) {
  return (
    <header className="nav-wrap">
      <a className="brand" href="#top" aria-label="GXLD home">
        <span className="brand-mark">GX</span>
        <span>GXLD</span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <a href="#work">Work</a>
        <a href="#pricing">Pricing</a>
        <a href="#process">Process</a>
        <a href="#faq">FAQ</a>
      </nav>
      <button className="nav-cta" type="button" onClick={onContact}>
        <MessageCircle size={16} />
        Let's Talk
      </button>
    </header>
  );
}

function Hero({ onContact, onPreview }) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={14} />
          Roblox UI Designer - Available for hire
        </div>
        <h1>
          Bold Roblox UI that feels <span>ready to play</span>.
        </h1>
        <p>
          High quality Figma interfaces and Roblox Studio imports for shops, inventories, HUDs,
          progression screens, and full game UI systems.
        </p>
        <div className="hero-actions">
          <a className="btn primary" href="#work">
            View Work
            <ArrowRight size={17} />
          </a>
          <button className="btn ghost" type="button" onClick={onContact}>
            Open Ticket
            <Ticket size={17} />
          </button>
        </div>
        <div className="tool-strip" aria-label="Tools and delivery stats">
          <span>Tools</span>
          <b>Figma</b>
          <b>Photoshop</b>
          <b>Discord</b>
          <b>Roblox</b>
        </div>
      </div>

      <div className="hero-visual" aria-label="Featured Roblox UI preview">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <article className="preview-window">
          <div className="window-top">
            <span />
            <span />
            <span />
            <strong>Featured / Preview</strong>
          </div>
          <button className="hero-preview-button" type="button" onClick={onPreview}>
            <img src="/assets/anime-stud.jpg" alt="Anime Roblox UI display by GXLD" />
            <span>
              <Maximize2 size={16} />
              Open full preview
            </span>
          </button>
          <div className="preview-caption">
            <div>
              <span>Current style</span>
              <b>Anime Stud UI</b>
            </div>
            <a href="#work" aria-label="Jump to portfolio work">
              <Play size={15} fill="currentColor" />
            </a>
          </div>
        </article>
        <div className="stat-card">
          <strong>50+</strong>
          <span>frames delivered</span>
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="showcase" aria-label="Service highlights">
      {[
        ["Design", "Custom frame systems, icons, menus, shops, and game HUDs.", Palette],
        ["Import", "Clean Studio-ready layouts built for real Roblox screens.", Layers3],
        ["Polish", "Glow, depth, motion-ready details, and style consistency.", Wand2],
        ["Secure", "Clear deliverables, source files, and daily updates.", ShieldCheck],
      ].map(([title, text, Icon]) => (
        <article className="mini-card" key={title}>
          <Icon size={18} />
          <h2>{title}</h2>
          <p>{text}</p>
        </article>
      ))}
    </section>
  );
}

function Gallery({ activeAll, onShowAll, onBack, onPreview }) {
  const shownWork = activeAll ? work : work.filter((item) => item.featured);

  return (
    <section className={`section work-section ${activeAll ? "all-work" : ""}`} id="work">
      <div className="section-topline">
        <SectionHeader
          kicker={activeAll ? "Full Portfolio" : "Featured Work"}
          title={activeAll ? "All UI Displays" : "Selected Displays"}
          text={
            activeAll
              ? "Every display from the current portfolio set, organized for quick previewing."
              : "Four strongest displays up front. Open any preview here, or jump into the full set."
          }
        />
        <div className="section-actions">
          {activeAll ? (
            <button className="btn dark" type="button" onClick={onBack}>
              <ArrowLeft size={16} />
              Featured
            </button>
          ) : (
            <button className="btn primary" type="button" onClick={onShowAll}>
              <LayoutGrid size={16} />
              View All
            </button>
          )}
        </div>
      </div>
      <div className={activeAll ? "work-grid full" : "work-grid featured"}>
        {shownWork.map((item) => (
          <WorkCard item={item} key={item.title} onPreview={() => onPreview(item)} />
        ))}
      </div>
    </section>
  );
}

function WorkCard({ item, onPreview }) {
  return (
    <article className={`work-card tone-${item.tone}`}>
      <button className="work-button" type="button" onClick={onPreview} aria-label={`Open ${item.title} preview`}>
        <img src={item.image} alt={`${item.title} Roblox UI display`} decoding="async" />
        <div className="work-sheen" />
        <div className="work-meta">
          <span>{item.type}</span>
          <h3>{item.title}</h3>
          <p>{item.tag}</p>
        </div>
        <span className="work-link">
          <Maximize2 size={16} />
        </span>
      </button>
    </article>
  );
}

function Pricing({ onContact }) {
  return (
    <section className="section pricing" id="pricing">
      <SectionHeader
        kicker="Simple Pricing"
        title="Easy. Quick. Secure."
        text="Frame-based pricing keeps commissions clear from the first message."
      />
      <div className="pricing-grid">
        {packages.map((item) => (
          <article className={`price-card ${item.featured ? "featured" : ""}`} key={item.name}>
            {item.featured && <span className="badge">Best Value</span>}
            <h3>{item.name}</h3>
            <div className="price">
              {item.price}
              <span>/ frame</span>
            </div>
            <p className="robux">{item.robux}</p>
            <p>{item.note}</p>
            <ul>
              {item.features.map((feature) => (
                <li key={feature}>
                  <BadgeCheck size={15} />
                  {feature}
                </li>
              ))}
            </ul>
            <button className={item.featured ? "btn primary" : "btn dark"} type="button" onClick={onContact}>
              Start
              <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    ["01", "Open request", "Send references, budget, frame count, deadline, and whether you need import."],
    ["02", "Track ticket", "Use your ticket code to return for status, notes, and replies from the same browser."],
    ["03", "Deliver", "Review, approve, pay, and receive final files plus source assets."],
  ];

  return (
    <section className="section process" id="process">
      <SectionHeader
        kicker="How It Works"
        title="A clearer commission flow."
        text="Built for developers who need polished UI without vague timelines."
      />
      <div className="process-grid">
        {steps.map(([num, title, text]) => (
          <article className="step" data-step={num} key={num}>
            <span>{num}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq({ onContact }) {
  return (
    <section className="section faq" id="faq">
      <div className="faq-layout">
        <div>
          <SectionHeader
            kicker="Questions"
            title="FAQ"
            text="Fast answers for the stuff people usually ask before commissioning."
          />
          <div className="contact-panel" id="contact">
            <Gem size={22} />
            <h3>Ready to commission?</h3>
            <p>Choose a website ticket for a structured request, or continue through Discord.</p>
            <button className="btn primary" type="button" onClick={onContact}>
              <MessageCircle size={17} />
              Let's Talk
            </button>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>
                {question}
                <ChevronDown size={17} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewModal({ item, onClose }) {
  return (
    <ModalShell onClose={onClose} size="preview">
      <div className={`preview-modal tone-${item.tone}`}>
        <div className="modal-heading">
          <div>
            <span className="modal-kicker">{item.type}</span>
            <h2>{item.title}</h2>
            <p>{item.tag}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </div>
        <div className="large-preview-frame">
          <img src={item.image} alt={`${item.title} enlarged Roblox UI preview`} />
        </div>
      </div>
    </ModalShell>
  );
}

function ContactModal({ mode, setMode, tickets, updateTickets, onClose }) {
  return (
    <ModalShell onClose={onClose} size="contact">
      <div className="contact-modal">
        <div className="modal-heading">
          <div>
            <span className="modal-kicker">Contact</span>
            <h2>{getContactTitle(mode)}</h2>
            <p>{getContactSubtitle(mode)}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close contact panel">
            <X size={18} />
          </button>
        </div>
        {mode === "choice" && <ContactChoice setMode={setMode} />}
        {mode === "discord" && <DiscordInstructions setMode={setMode} />}
        {mode === "ticket" && <TicketDesk tickets={tickets} updateTickets={updateTickets} setMode={setMode} />}
        {mode === "admin" && <AdminDesk tickets={tickets} updateTickets={updateTickets} setMode={setMode} />}
      </div>
    </ModalShell>
  );
}

function ContactChoice({ setMode }) {
  return (
    <div className="choice-grid">
      <button className="choice-card" type="button" onClick={() => setMode("ticket")}>
        <Ticket size={22} />
        <strong>Open Website Ticket</strong>
        <span>Structured request, ticket code, and saved status on this device.</span>
      </button>
      <button className="choice-card" type="button" onClick={() => setMode("discord")}>
        <MessageCircle size={22} />
        <strong>Continue Through Discord</strong>
        <span>Use the Discord user ID and send a direct message manually.</span>
      </button>
      <button className="choice-card compact" type="button" onClick={() => setMode("admin")}>
        <Shield size={20} />
        <strong>Administration</strong>
        <span>Review tickets with the owner access code.</span>
      </button>
    </div>
  );
}

function DiscordInstructions({ setMode }) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(DISCORD_USER_ID);
    setCopied(true);
  };

  return (
    <div className="discord-panel">
      <div className="id-card">
        <span>Discord User ID</span>
        <strong>{DISCORD_USER_ID}</strong>
        <button className="btn primary" type="button" onClick={copyId}>
          <Copy size={16} />
          {copied ? "Copied" : "Copy ID"}
        </button>
      </div>
      <ol className="clean-steps">
        <li>Paste the user ID into any Discord chat.</li>
        <li>Click on my profile.</li>
        <li>Send me a direct message with your brief, references, and budget.</li>
      </ol>
      <button className="btn dark" type="button" onClick={() => setMode("choice")}>
        <ArrowLeft size={16} />
        Back
      </button>
    </div>
  );
}

function TicketDesk({ tickets, updateTickets, setMode }) {
  const [view, setView] = useState("create");
  const [activeTicket, setActiveTicket] = useState(null);
  const [lookupCode, setLookupCode] = useState("");

  const findTicket = () => {
    const found = tickets.find((ticket) => ticket.code.toLowerCase() === lookupCode.trim().toLowerCase());
    if (found) setActiveTicket(found);
  };

  if (activeTicket) {
    return <TicketView ticket={activeTicket} tickets={tickets} updateTickets={updateTickets} onBack={() => setActiveTicket(null)} />;
  }

  return (
    <div className="ticket-desk">
      <div className="segmented">
        <button className={view === "create" ? "active" : ""} type="button" onClick={() => setView("create")}>
          <Ticket size={15} />
          New Ticket
        </button>
        <button className={view === "lookup" ? "active" : ""} type="button" onClick={() => setView("lookup")}>
          <LogIn size={15} />
          Return
        </button>
      </div>
      {view === "create" ? (
        <TicketForm
          onCreated={(ticket) => {
            updateTickets([ticket, ...tickets]);
            setActiveTicket(ticket);
          }}
        />
      ) : (
        <div className="lookup-panel">
          <label>
            Ticket code
            <input value={lookupCode} onChange={(event) => setLookupCode(event.target.value)} placeholder="GX-ABCDE" />
          </label>
          <button className="btn primary" type="button" onClick={findTicket}>
            <Search size={16} />
            Find Ticket
          </button>
          <button className="btn dark" type="button" onClick={() => setMode("choice")}>
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      )}
    </div>
  );
}

function TicketForm({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    discord: "",
    email: "",
    packageType: "UI + Import",
    budget: "",
    deadline: "",
    brief: "",
  });

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const now = new Date().toISOString();
    onCreated({
      ...form,
      id: crypto.randomUUID(),
      code: makeTicketCode(),
      status: "Open",
      createdAt: now,
      updatedAt: now,
      adminNote: "Thanks for opening a ticket. GXLD will review your brief and reply soon.",
      replies: [],
    });
  };

  return (
    <form className="ticket-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Name
          <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Your name" />
        </label>
        <label>
          Discord
          <input required value={form.discord} onChange={(event) => updateField("discord", event.target.value)} placeholder="@username" />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Optional" />
        </label>
        <label>
          Package
          <select value={form.packageType} onChange={(event) => updateField("packageType", event.target.value)}>
            <option>UI + Import</option>
            <option>UI Only</option>
            <option>Import Only</option>
          </select>
        </label>
        <label>
          Budget
          <input value={form.budget} onChange={(event) => updateField("budget", event.target.value)} placeholder="$ / Robux" />
        </label>
        <label>
          Deadline
          <input value={form.deadline} onChange={(event) => updateField("deadline", event.target.value)} placeholder="Example: 2 weeks" />
        </label>
      </div>
      <label>
        Project brief
        <textarea
          required
          value={form.brief}
          onChange={(event) => updateField("brief", event.target.value)}
          placeholder="Frames needed, references, game style, import details, and anything important."
        />
      </label>
      <button className="btn primary" type="submit">
        <Send size={16} />
        Create Ticket
      </button>
    </form>
  );
}

function TicketView({ ticket, tickets, updateTickets, onBack }) {
  const [message, setMessage] = useState("");

  const addReply = () => {
    if (!message.trim()) return;
    const nextTickets = tickets.map((item) =>
      item.id === ticket.id
        ? {
            ...item,
            updatedAt: new Date().toISOString(),
            replies: [...item.replies, { from: "Client", body: message.trim(), at: new Date().toISOString() }],
          }
        : item,
    );
    updateTickets(nextTickets);
    setMessage("");
  };

  const currentTicket = tickets.find((item) => item.id === ticket.id) || ticket;

  return (
    <div className="ticket-view">
      <div className="ticket-summary">
        <button className="icon-btn" type="button" onClick={onBack} aria-label="Back to ticket lookup">
          <ArrowLeft size={17} />
        </button>
        <div>
          <span>{currentTicket.code}</span>
          <h3>{currentTicket.packageType}</h3>
          <p>{currentTicket.status} - Updated {new Date(currentTicket.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="status-row">
        <StatusPill status={currentTicket.status} />
        <span>{currentTicket.name}</span>
        <span>{currentTicket.discord}</span>
      </div>
      <div className="ticket-body">
        <strong>Project Brief</strong>
        <p>{currentTicket.brief}</p>
      </div>
      <div className="reply-list">
        <Reply from="GXLD" body={currentTicket.adminNote} at={currentTicket.updatedAt} />
        {currentTicket.replies.map((reply, index) => (
          <Reply key={`${reply.at}-${index}`} {...reply} />
        ))}
      </div>
      <div className="reply-box">
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a message or extra reference notes." />
        <button className="btn primary" type="button" onClick={addReply}>
          <Send size={16} />
          Reply
        </button>
      </div>
    </div>
  );
}

function AdminDesk({ tickets, updateTickets, setMode }) {
  const [accessCode, setAccessCode] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");

  const selected = useMemo(() => tickets.find((ticket) => ticket.id === selectedId) || tickets[0], [tickets, selectedId]);

  if (!isAuthed) {
    return (
      <div className="lookup-panel">
        <label>
          Owner access code
          <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Access code" />
        </label>
        <button className="btn primary" type="button" onClick={() => setIsAuthed(accessCode === ADMIN_ACCESS_CODE)}>
          <Shield size={16} />
          Enter Admin
        </button>
        <button className="btn dark" type="button" onClick={() => setMode("choice")}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
    );
  }

  const updateSelected = (changes) => {
    const nextTickets = tickets.map((ticket) =>
      ticket.id === selected.id ? { ...ticket, ...changes, updatedAt: new Date().toISOString() } : ticket,
    );
    updateTickets(nextTickets);
  };

  const saveNote = () => {
    if (!selected || !note.trim()) return;
    updateSelected({ adminNote: note.trim() });
    setNote("");
  };

  return (
    <div className="admin-grid">
      <div className="ticket-list">
        {tickets.length === 0 && (
          <div className="empty-state">
            <Inbox size={26} />
            <strong>No tickets yet</strong>
            <span>New website requests will appear here.</span>
          </div>
        )}
        {tickets.map((ticket) => (
          <button
            className={selected?.id === ticket.id ? "ticket-row active" : "ticket-row"}
            type="button"
            key={ticket.id}
            onClick={() => setSelectedId(ticket.id)}
          >
            <span>{ticket.code}</span>
            <strong>{ticket.name}</strong>
            <small>{ticket.status}</small>
          </button>
        ))}
      </div>
      {selected && (
        <div className="admin-detail">
          <div className="ticket-summary">
            <UserRound size={20} />
            <div>
              <span>{selected.code}</span>
              <h3>{selected.name}</h3>
              <p>{selected.discord} - {selected.packageType}</p>
            </div>
          </div>
          <div className="status-edit">
            <label>
              Status
              <select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value })}>
                <option>Open</option>
                <option>In Review</option>
                <option>Quoted</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </label>
          </div>
          <div className="ticket-body">
            <strong>Brief</strong>
            <p>{selected.brief}</p>
          </div>
          <div className="reply-box">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={selected.adminNote} />
            <button className="btn primary" type="button" onClick={saveNote}>
              <CheckCircle2 size={16} />
              Save GXLD Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Reply({ from, body, at }) {
  return (
    <article className="reply">
      <div>
        <strong>{from}</strong>
        <span>{new Date(at).toLocaleString()}</span>
      </div>
      <p>{body}</p>
    </article>
  );
}

function StatusPill({ status }) {
  const Icon = status === "Completed" ? CheckCircle2 : Clock3;
  return (
    <span className="status-pill">
      <Icon size={14} />
      {status}
    </span>
  );
}

function ModalShell({ children, onClose, size }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className={`modal-card ${size}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ kicker, title, text }) {
  return (
    <div className="section-header">
      <span>
        <Zap size={13} />
        {kicker}
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function getContactTitle(mode) {
  if (mode === "discord") return "Discord Contact";
  if (mode === "ticket") return "Website Ticket";
  if (mode === "admin") return "Admin Desk";
  return "How do you want to continue?";
}

function getContactSubtitle(mode) {
  if (mode === "discord") return "Copy the ID, paste it into Discord, and message the profile.";
  if (mode === "ticket") return "Create a request or return using an existing ticket code.";
  if (mode === "admin") return "Review and update website ticket requests.";
  return "Choose the fastest path for your commission.";
}

createRoot(document.getElementById("root")).render(<App />);
