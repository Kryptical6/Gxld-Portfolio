import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  DollarSign,
  Download,
  EyeOff,
  Gem,
  Hammer,
  Inbox,
  KeyRound,
  Layers3,
  LayoutGrid,
  Lock,
  LogIn,
  LogOut,
  Maximize2,
  MessageCircle,
  Palette,
  Play,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  Unlock,
  UserRound,
  Wallet,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import "./styles.css";
import { ToastProvider, useToast } from "./toast";
import {
  addAdminReply,
  addClientReply,
  adminSignIn,
  adminSignOut,
  createTicket,
  deleteTicket,
  getAdminSession,
  getTicketByCode,
  isCloud,
  listTickets,
  subscribeTickets,
  updateTicket,
} from "./tickets";

const DISCORD_USER_ID = "<@1188805446455271426>";
// Ordered commission stages. Payment is collected on delivery: files stay locked
// until GXLD confirms payment has landed, then they release to the client.
const TICKET_STATUSES = ["Open", "In Review", "Quoted", "In Progress", "Ready for Delivery", "Delivered"];

// Payment details shown to the client on the delivery step. Replace the placeholders
// with your real PayPal link and Roblox group/community URL.
const PAYMENT = {
  paypal: "https://paypal.me/pay329876",
  robux: "https://www.roblox.com/game-pass/1683061964/Commisions",
};

// Length caps mirrored by SQL check constraints (basic anti-abuse).
const LIMITS = { name: 120, discord: 80, email: 160, budget: 60, deadline: 60, brief: 4000, reply: 4000 };

const ADMIN_SEEN_KEY = "gxld-admin-last-seen";

const playBeep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch {
    // audio is a nicety; ignore failures
  }
};

const notifyNewTickets = (fresh) => {
  playBeep();
  if (typeof Notification === "undefined") return;
  const show = () =>
    fresh.forEach((ticket) => new Notification("New GXLD ticket", { body: `${ticket.name} - ${ticket.packageType}` }));
  if (Notification.permission === "granted") show();
  else if (Notification.permission !== "denied") Notification.requestPermission().then((p) => p === "granted" && show());
};

const exportTicketsCsv = (tickets) => {
  const headers = ["code", "name", "discord", "email", "package", "status", "quote", "budget", "deadline", "created", "updated", "brief"];
  const esc = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = tickets.map((t) =>
    [t.code, t.name, t.discord, t.email, t.packageType, t.status, t.quote, t.budget, t.deadline, t.createdAt, t.updatedAt, t.brief]
      .map(esc)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gxld-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// To get an email when a ticket is opened, paste a Formspree endpoint here
// (create a free form at https://formspree.io and use its "https://formspree.io/f/xxxx" URL).
// Any webhook/endpoint that accepts a JSON POST works too. Leave empty to disable.
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

const heroPreview = work.find((item) => item.title === "Minimal Anime Suite");

const faqs = [
  ["How long does a commission take?", "Usually 2 days to 2 weeks depending on how many frames, revisions, and import work are needed."],
  ["What does importing mean?", "Turning the UI into Roblox Studio elements, scaling it correctly, and preparing the frame so it works in-game."],
  ["Can you match a specific style?", "Yes. Send references, moodboards, or screenshots and the design can be matched while still feeling original."],
  ["Do I get the original files?", "Yes. Finished work includes export assets and originals so your team can keep editing later."],
];

const copyText = async (value) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    document.body.removeChild(field);
    return true;
  } catch {
    return false;
  }
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function useScrollReveal(deps = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal:not(.in)"));
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function CountUp({ end, suffix = "", duration = 1400 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (prefersReducedMotion() || !node || !("IntersectionObserver" in window)) {
      setValue(end);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            setValue(Math.round(end * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [end, duration]);

  return (
    <strong ref={ref}>
      {value}
      {suffix}
    </strong>
  );
}

function App() {
  const [activePreview, setActivePreview] = useState(null);
  const [showAllWork, setShowAllWork] = useState(false);
  const [contactMode, setContactMode] = useState(null);

  useScrollReveal([showAllWork]);

  return (
    <main className="site-shell">
      <div className="beam beam-one" aria-hidden="true" />
      <div className="beam beam-two" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <Nav onContact={() => setContactMode("choice")} />
      <Hero onContact={() => setContactMode("choice")} onPreview={() => setActivePreview(heroPreview)} />
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
      <Footer onContact={() => setContactMode("choice")} />
      {activePreview && <PreviewModal item={activePreview} onNavigate={setActivePreview} onClose={() => setActivePreview(null)} />}
      {contactMode && <ContactModal mode={contactMode} setMode={setContactMode} onClose={() => setContactMode(null)} />}
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
            <img src="/assets/minimal-anime.jpg" alt="Minimal Anime Suite Roblox UI display by GXLD" />
            <span>
              <Maximize2 size={16} />
              Open full preview
            </span>
          </button>
          <div className="preview-caption">
            <div>
              <span>Current style</span>
              <b>Minimal Anime Suite</b>
            </div>
            <a href="#work" aria-label="Jump to portfolio work">
              <Play size={15} fill="currentColor" />
            </a>
          </div>
        </article>
        <div className="stat-card">
          <CountUp end={50} suffix="+" />
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
        <article className="mini-card reveal" key={title}>
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
  const onMove = (event) => {
    if (prefersReducedMotion()) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--ry", `${px * 6}deg`);
    card.style.setProperty("--rx", `${py * -6}deg`);
  };

  const onLeave = (event) => {
    event.currentTarget.style.removeProperty("--rx");
    event.currentTarget.style.removeProperty("--ry");
  };

  return (
    <article className={`work-card tone-${item.tone} reveal`} onMouseMove={onMove} onMouseLeave={onLeave}>
      <button className="work-button" type="button" onClick={onPreview} aria-label={`Open ${item.title} preview`}>
        <img src={item.image} alt={`${item.title} Roblox UI display`} decoding="async" loading="lazy" />
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
          <article className={`price-card reveal ${item.featured ? "featured" : ""}`} key={item.name}>
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
      <div className="trust-strip reveal">
        <ShieldCheck size={20} />
        <p>
          <strong>Pay on delivery.</strong> You only pay once the work is finished and you have seen it - then your files
          unlock instantly through your ticket.
        </p>
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
          <article className="step reveal" data-step={num} key={num}>
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
          <div className="contact-panel reveal" id="contact">
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
            <details className="reveal" key={question} open={index === 0}>
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

function Footer({ onContact }) {
  return (
    <footer className="site-footer reveal">
      <div className="footer-main">
        <div className="footer-brand">
          <a className="brand" href="#top" aria-label="GXLD home">
            <span className="brand-mark">GX</span>
            <span>GXLD</span>
          </a>
          <p>Bold Roblox UI design and clean Studio imports for shops, inventories, HUDs, and full game systems.</p>
          <button className="btn primary" type="button" onClick={onContact}>
            <MessageCircle size={16} />
            Let's Talk
          </button>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <strong>Explore</strong>
          <a href="#work">Work</a>
          <a href="#pricing">Pricing</a>
          <a href="#process">Process</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="footer-tools">
          <strong>Built with</strong>
          <span>Figma</span>
          <span>Photoshop</span>
          <span>Roblox Studio</span>
          <span>Discord</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} GXLD - Roblox UI Design</span>
        <span>Available for commissions</span>
      </div>
    </footer>
  );
}

function PreviewModal({ item, onNavigate, onClose }) {
  const index = work.findIndex((entry) => entry.title === item.title);
  const go = (delta) => {
    if (index < 0) return;
    onNavigate(work[(index + delta + work.length) % work.length]);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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
          <button className="preview-nav prev" type="button" onClick={() => go(-1)} aria-label="Previous display">
            <ArrowLeft size={20} />
          </button>
          <img src={item.image} alt={`${item.title} enlarged Roblox UI preview`} />
          <button className="preview-nav next" type="button" onClick={() => go(1)} aria-label="Next display">
            <ArrowRight size={20} />
          </button>
        </div>
        <div className="preview-counter">
          {index + 1} / {work.length}
        </div>
      </div>
    </ModalShell>
  );
}

function ContactModal({ mode, setMode, onClose }) {
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
        {mode === "ticket" && <TicketDesk setMode={setMode} />}
        {mode === "admin" && <AdminDesk setMode={setMode} />}
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
        <span>Structured request with a ticket code to track status and receive your files.</span>
      </button>
      <button className="choice-card" type="button" onClick={() => setMode("discord")}>
        <MessageCircle size={22} />
        <strong>Continue Through Discord</strong>
        <span>Use the Discord user ID and send a direct message manually.</span>
      </button>
      <button className="choice-card compact" type="button" onClick={() => setMode("admin")}>
        <Shield size={20} />
        <strong>Administration</strong>
        <span>Owner login to review and manage all tickets.</span>
      </button>
    </div>
  );
}

function DiscordInstructions({ setMode }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copyId = async () => {
    if (await copyText(DISCORD_USER_ID)) {
      setCopied(true);
      toast("Discord ID copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast("Couldn't copy - copy it manually", "error");
    }
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

function TicketDesk({ setMode }) {
  const [view, setView] = useState("create");
  const [activeTicket, setActiveTicket] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [lookupCode, setLookupCode] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [looking, setLooking] = useState(false);

  const findTicket = async () => {
    if (!lookupCode.trim() || looking) return;
    setLooking(true);
    setLookupError("");
    try {
      const found = await getTicketByCode(lookupCode);
      if (found) setActiveTicket(found);
      else setLookupError("No ticket found with that code.");
    } catch {
      setLookupError("Could not reach the server. Please try again.");
    } finally {
      setLooking(false);
    }
  };

  if (createdTicket) {
    return (
      <TicketCreated
        ticket={createdTicket}
        onView={() => {
          setActiveTicket(createdTicket);
          setCreatedTicket(null);
        }}
      />
    );
  }

  if (activeTicket) {
    return <TicketView ticket={activeTicket} onBack={() => setActiveTicket(null)} />;
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
        <TicketForm onCreated={(ticket) => setCreatedTicket(ticket)} />
      ) : (
        <div className="lookup-panel">
          <label>
            Ticket code
            <input
              value={lookupCode}
              onChange={(event) => {
                setLookupCode(event.target.value);
                setLookupError("");
              }}
              onKeyDown={(event) => event.key === "Enter" && findTicket()}
              placeholder="GX-ABCDE"
            />
          </label>
          {lookupError && <p className="form-error">{lookupError}</p>}
          <button className="btn primary" type="button" onClick={findTicket} disabled={looking}>
            <Search size={16} />
            {looking ? "Searching..." : "Find Ticket"}
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

function TicketCreated({ ticket, onView }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copyCode = async () => {
    if (await copyText(ticket.code)) {
      setCopied(true);
      toast("Ticket code copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast("Couldn't copy - write it down", "error");
    }
  };

  return (
    <div className="ticket-created">
      <div className="created-icon">
        <CheckCircle2 size={30} />
      </div>
      <h3>Ticket created</h3>
      <p>
        Save your code below. It is the only way to return to this ticket and receive your files - GXLD cannot recover it
        for you.
      </p>
      <div className="code-card">
        <span>
          <KeyRound size={14} />
          Your ticket code
        </span>
        <strong>{ticket.code}</strong>
        <button className="btn primary" type="button" onClick={copyCode}>
          <Copy size={16} />
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <p className="safety-note">
        <ShieldAlert size={15} />
        Keep this private. Anyone with your code can open this ticket on this device.
      </p>
      <button className="btn dark" type="button" onClick={onView}>
        Open my ticket
        <ArrowRight size={16} />
      </button>
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const ticket = await createTicket(form);
      onCreated(ticket);
    } catch {
      setError("Could not create your ticket. Please try again in a moment.");
      setSubmitting(false);
    }
  };

  return (
    <form className="ticket-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Name
          <input required maxLength={LIMITS.name} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Your name" />
        </label>
        <label>
          Discord
          <input required maxLength={LIMITS.discord} value={form.discord} onChange={(event) => updateField("discord", event.target.value)} placeholder="@username" />
        </label>
        <label>
          Email
          <input type="email" maxLength={LIMITS.email} value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Optional" />
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
          <input maxLength={LIMITS.budget} value={form.budget} onChange={(event) => updateField("budget", event.target.value)} placeholder="$ / Robux" />
        </label>
        <label>
          Deadline
          <input maxLength={LIMITS.deadline} value={form.deadline} onChange={(event) => updateField("deadline", event.target.value)} placeholder="Example: 2 weeks" />
        </label>
      </div>
      <label>
        Project brief
        <textarea
          required
          maxLength={LIMITS.brief}
          value={form.brief}
          onChange={(event) => updateField("brief", event.target.value)}
          placeholder="Frames needed, references, game style, import details, and anything important."
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn primary" type="submit" disabled={submitting}>
        <Send size={16} />
        {submitting ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}

function TicketView({ ticket, onBack }) {
  const [current, setCurrent] = useState(ticket);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await getTicketByCode(current.code);
      if (fresh) setCurrent(fresh);
    } catch {
      // keep showing the last known state
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Pull the latest state from the backend when the ticket opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    refresh();
  }, []);

  const addReply = async () => {
    if (!message.trim() || busy) return;
    setBusy(true);
    try {
      const updated = await addClientReply(current.code, message);
      if (updated) setCurrent(updated);
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  const isDelivered = current.status === "Delivered";
  const isReady = current.status === "Ready for Delivery";
  const delivery = current.delivery;

  return (
    <div className="ticket-view">
      <div className="ticket-summary">
        <button className="icon-btn" type="button" onClick={onBack} aria-label="Back to ticket lookup">
          <ArrowLeft size={17} />
        </button>
        <div>
          <span>{current.code}</span>
          <h3>{current.packageType}</h3>
          <p>{current.status} - Updated {new Date(current.updatedAt).toLocaleDateString()}</p>
        </div>
        <button className="icon-btn" type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh ticket">
          <RefreshCw size={16} />
        </button>
      </div>
      <TicketProgress status={current.status} />
      <div className="status-row">
        <StatusPill status={current.status} />
        <span>{current.name}</span>
        <span>{current.discord}</span>
        {current.quote && <span className="quote-chip">Quote: {current.quote}</span>}
      </div>
      <div className="ticket-body">
        <strong>Project Brief</strong>
        <p>{current.brief}</p>
      </div>

      <div className={`delivery-card ${isDelivered ? "unlocked" : isReady ? "ready" : "locked"}`}>
        <div className="delivery-head">
          {isDelivered ? <Unlock size={18} /> : <Lock size={18} />}
          <strong>{isDelivered ? "Files unlocked" : isReady ? "Payment due" : "Delivery"}</strong>
        </div>
        {isDelivered ? (
          <>
            {delivery?.link ? (
              <a className="btn primary" href={delivery.link} target="_blank" rel="noopener noreferrer">
                <Download size={16} />
                Download your files
              </a>
            ) : (
              <p>Payment confirmed. Your files have been released - check the replies below for the link.</p>
            )}
            {delivery?.note && <p className="delivery-note">{delivery.note}</p>}
          </>
        ) : isReady ? (
          <>
            <p>Your project is finished. Complete payment and your files unlock here automatically.</p>
            <PaymentInstructions quote={current.quote} />
          </>
        ) : (
          <p>Your files appear here once the project is finished and your payment is confirmed.</p>
        )}
      </div>

      <div className="reply-list">
        <Reply from="GXLD" body={current.adminNote} at={current.adminNoteAt || current.createdAt} />
        {current.replies.map((reply, index) => (
          <Reply key={`${reply.at}-${index}`} {...reply} />
        ))}
      </div>
      <div className="reply-box">
        <textarea maxLength={LIMITS.reply} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a message, payment proof, or extra reference notes." />
        <button className="btn primary" type="button" onClick={addReply} disabled={busy}>
          <Send size={16} />
          {busy ? "Sending..." : "Reply"}
        </button>
      </div>

      <p className="safety-note">
        <ShieldAlert size={15} />
        Keep your ticket code private. GXLD will never DM you first asking for payment, and only ever uses the payment
        details shown above.
      </p>
    </div>
  );
}

function AdminDesk({ setMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [dateRange, setDateRange] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => Number(localStorage.getItem(ADMIN_SEEN_KEY)) || 0);
  const toast = useToast();
  const knownIds = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const next = await listTickets();
      // After the first load, announce tickets that are genuinely new.
      if (knownIds.current) {
        const fresh = next.filter((ticket) => !knownIds.current.has(ticket.id));
        if (fresh.length) {
          notifyNewTickets(fresh);
          toast(`${fresh.length} new ticket${fresh.length > 1 ? "s" : ""}`, "success");
        }
      }
      knownIds.current = new Set(next.map((ticket) => ticket.id));
      setTickets(next);
    } catch {
      // surfaced indirectly via empty list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (await getAdminSession()) {
        setIsAuthed(true);
        load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates: Supabase realtime in cloud mode, light polling otherwise.
  useEffect(() => {
    if (!isAuthed) return undefined;
    const unsub = subscribeTickets(load);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const markSeen = () => {
    const now = Date.now();
    setLastSeen(now);
    localStorage.setItem(ADMIN_SEEN_KEY, String(now));
  };

  const unreadCount = useMemo(
    () => tickets.filter((ticket) => new Date(ticket.createdAt).getTime() > lastSeen).length,
    [tickets, lastSeen],
  );

  const counts = useMemo(() => {
    const active = tickets.filter((ticket) => showArchived || !ticket.archived);
    const base = { All: active.length };
    TICKET_STATUSES.forEach((status) => {
      base[status] = active.filter((ticket) => ticket.status === status).length;
    });
    return base;
  }, [tickets, showArchived]);

  const visibleTickets = useMemo(() => {
    const term = query.trim().toLowerCase();
    // Relative date filtering legitimately needs the current time.
    // eslint-disable-next-line react-hooks/purity
    const cutoff = dateRange === "all" ? 0 : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;
    const sorters = {
      recent: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      status: (a, b) => TICKET_STATUSES.indexOf(a.status) - TICKET_STATUSES.indexOf(b.status),
    };
    return tickets
      .filter((ticket) => showArchived || !ticket.archived)
      .filter((ticket) => statusFilter === "All" || ticket.status === statusFilter)
      .filter((ticket) => new Date(ticket.createdAt).getTime() >= cutoff)
      .filter((ticket) => {
        if (!term) return true;
        return [ticket.code, ticket.name, ticket.discord, ticket.brief]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));
      })
      .sort(sorters[sort] || sorters.recent);
  }, [tickets, query, statusFilter, sort, dateRange, showArchived]);

  const exportCsv = () => {
    exportTicketsCsv(visibleTickets);
    toast("Exported visible tickets to CSV", "success");
  };

  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || visibleTickets[0],
    [tickets, selectedId, visibleTickets],
  );

  const tryAuth = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    const { ok, error } = await adminSignIn(email, password);
    setAuthBusy(false);
    if (ok) {
      setIsAuthed(true);
      load();
    } else {
      setAuthError(error || (isCloud ? "Login failed. Check your email and password." : "Incorrect access code."));
    }
  };

  const signOut = async () => {
    await adminSignOut();
    setIsAuthed(false);
    setPassword("");
    setTickets([]);
  };

  if (!isAuthed) {
    return (
      <div className="lookup-panel">
        {isCloud && (
          <label>
            Owner email
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setAuthError("");
              }}
              onKeyDown={(event) => event.key === "Enter" && tryAuth()}
              placeholder="you@email.com"
            />
          </label>
        )}
        <label>
          {isCloud ? "Password" : "Owner access code"}
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setAuthError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && tryAuth()}
            placeholder={isCloud ? "Password" : "Access code"}
          />
        </label>
        {authError && <p className="form-error">{authError}</p>}
        <button className="btn primary" type="button" onClick={tryAuth} disabled={authBusy}>
          <Shield size={16} />
          {authBusy ? "Checking..." : "Enter Admin"}
        </button>
        <button className="btn dark" type="button" onClick={() => setMode("choice")}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-toolbar">
        {unreadCount > 0 && (
          <button className="btn dark unread-pill" type="button" onClick={markSeen} title="Mark all as seen">
            <span className="unread-dot" />
            {unreadCount} new
          </button>
        )}
        <button className="btn dark" type="button" onClick={load} disabled={loading}>
          <RefreshCw size={15} />
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button className="btn dark" type="button" onClick={exportCsv} disabled={!visibleTickets.length}>
          <Download size={15} />
          CSV
        </button>
        {isCloud && (
          <button className="btn dark" type="button" onClick={signOut}>
            <LogOut size={15} />
            Sign out
          </button>
        )}
      </div>
      <div className="admin-stats">
        {["All", ...TICKET_STATUSES].map((status) => (
          <button
            className={statusFilter === status ? "stat-chip active" : "stat-chip"}
            type="button"
            key={status}
            onClick={() => setStatusFilter(status)}
          >
            <strong>{counts[status] ?? 0}</strong>
            <span>{status}</span>
          </button>
        ))}
      </div>
      {tickets.length === 0 ? (
        loading ? (
          <div className="skeleton-list">
            {[0, 1, 2, 3, 4].map((row) => (
              <div className="skeleton-row" key={row} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Inbox size={26} />
            <strong>No tickets yet</strong>
            <span>New website requests will appear here.</span>
          </div>
        )
      ) : (
        <>
          <div className="admin-controls">
            <div className="admin-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, name, Discord, or brief" />
            </div>
            <select className="admin-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort tickets">
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="status">By stage</option>
            </select>
            <select className="admin-select" value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Filter by date">
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              className={showArchived ? "btn dark active" : "btn dark"}
              type="button"
              onClick={() => setShowArchived((value) => !value)}
            >
              <Archive size={15} />
              {showArchived ? "Showing archived" : "Show archived"}
            </button>
          </div>
          <div className="admin-grid">
            <div className="ticket-list">
              {visibleTickets.length === 0 && (
                <div className="empty-state compact">
                  <Inbox size={22} />
                  <span>No tickets match this filter.</span>
                </div>
              )}
              {visibleTickets.map((ticket) => {
                const isUnread = new Date(ticket.createdAt).getTime() > lastSeen;
                const classes = ["ticket-row"];
                if (selected?.id === ticket.id) classes.push("active");
                if (isUnread) classes.push("unread");
                if (ticket.archived) classes.push("archived");
                return (
                  <button className={classes.join(" ")} type="button" key={ticket.id} onClick={() => setSelectedId(ticket.id)}>
                    <span>
                      {isUnread && <span className="unread-dot" aria-label="New" />}
                      {ticket.code}
                      {ticket.archived && <em className="row-archived">archived</em>}
                    </span>
                    <strong>{ticket.name}</strong>
                    <small>
                      {ticket.status} - {new Date(ticket.updatedAt).toLocaleDateString()}
                    </small>
                  </button>
                );
              })}
            </div>
            {selected && <AdminDetail key={selected.id} ticket={selected} onChanged={load} />}
          </div>
        </>
      )}
    </div>
  );
}

function AdminDetail({ ticket, onChanged }) {
  const [reply, setReply] = useState("");
  const [quote, setQuote] = useState(ticket.quote || "");
  const [link, setLink] = useState(ticket.delivery?.link || "");
  const [deliveryNote, setDeliveryNote] = useState(ticket.delivery?.note || "");
  const [internalNote, setInternalNote] = useState(ticket.internalNote || "");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const run = async (action, successMessage) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await onChanged();
      if (successMessage) toast(successMessage, "success");
    } catch {
      toast("That didn't go through. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status) => run(() => updateTicket(ticket.id, { status }), `Status set to ${status}`);

  const sendReply = () => {
    if (!reply.trim()) return;
    run(async () => {
      await addAdminReply(ticket.id, reply);
      setReply("");
    }, "Reply sent");
  };

  const saveQuote = () => {
    const earlyStage = ticket.status === "Open" || ticket.status === "In Review";
    run(() => updateTicket(ticket.id, { quote: quote.trim(), ...(earlyStage ? { status: "Quoted" } : {}) }), "Quote saved");
  };

  const saveDelivery = () =>
    run(() => updateTicket(ticket.id, { delivery: { link: link.trim(), note: deliveryNote.trim() } }), "Delivery files saved");

  const saveInternalNote = () => run(() => updateTicket(ticket.id, { internalNote: internalNote.trim() }), "Private note saved");

  const releaseFiles = () => {
    if (!link.trim()) {
      toast("Add a delivery link before releasing files.", "error");
      return;
    }
    if (!window.confirm("Confirm payment received? This marks the ticket Delivered and unlocks the files for the client.")) {
      return;
    }
    run(
      () =>
        updateTicket(ticket.id, {
          status: "Delivered",
          delivery: { link: link.trim(), note: deliveryNote.trim() },
          releasedAt: new Date().toISOString(),
        }),
      "Files released to client",
    );
  };

  const removeTicket = () => {
    if (!window.confirm(`Delete ticket ${ticket.code} from ${ticket.name}? This cannot be undone.`)) return;
    run(() => deleteTicket(ticket.id), "Ticket deleted");
  };

  const toggleArchive = () =>
    run(() => updateTicket(ticket.id, { archived: !ticket.archived }), ticket.archived ? "Ticket unarchived" : "Ticket archived");

  return (
    <div className="admin-detail">
      <div className="admin-detail-top">
        <div className="ticket-summary">
          <UserRound size={20} />
          <div>
            <span>{ticket.code}</span>
            <h3>{ticket.name}</h3>
            <p>
              {ticket.discord} - {ticket.packageType}
            </p>
          </div>
        </div>
        <div className="detail-actions">
          <button
            className="icon-btn"
            type="button"
            onClick={toggleArchive}
            disabled={busy}
            aria-label={ticket.archived ? "Unarchive ticket" : "Archive ticket"}
            title={ticket.archived ? "Unarchive" : "Archive"}
          >
            {ticket.archived ? <ArchiveRestore size={17} /> : <Archive size={17} />}
          </button>
          <button className="icon-btn danger" type="button" onClick={removeTicket} disabled={busy} aria-label="Delete ticket">
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      <div className="admin-meta">
        {ticket.archived && <span className="meta-archived">Archived</span>}
        {ticket.email && <span>{ticket.email}</span>}
        {ticket.budget && <span>Budget: {ticket.budget}</span>}
        {ticket.deadline && <span>Deadline: {ticket.deadline}</span>}
        <span>Opened {new Date(ticket.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="status-edit">
        <label>
          Status
          <select value={ticket.status} onChange={(event) => changeStatus(event.target.value)} disabled={busy}>
            {TICKET_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="ticket-body">
        <strong>Brief</strong>
        <p>{ticket.brief}</p>
      </div>

      <div className="admin-panel-block">
        <label>
          Quote
          <div className="inline-field">
            <input value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="$40 / R$15k" />
            <button className="btn dark" type="button" onClick={saveQuote} disabled={busy}>
              Save
            </button>
          </div>
        </label>
      </div>

      <div className="admin-panel-block">
        <strong className="block-title">
          <Lock size={14} /> Delivery files
        </strong>
        <p className="block-hint">
          Upload files anywhere (Drive, Dropbox, MediaFire) and paste the share link. Files stay locked until you confirm
          payment.
        </p>
        <label>
          Delivery link
          <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://drive.google.com/..." />
        </label>
        <label>
          Delivery note
          <input value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} placeholder="What's included, install notes, etc." />
        </label>
        <div className="delivery-actions">
          <button className="btn dark" type="button" onClick={saveDelivery} disabled={busy}>
            Save files
          </button>
          <button className="btn primary" type="button" onClick={releaseFiles} disabled={busy}>
            <Unlock size={16} />
            Confirm payment &amp; release
          </button>
        </div>
        {ticket.status === "Delivered" && ticket.releasedAt && (
          <p className="block-hint released">Released {new Date(ticket.releasedAt).toLocaleString()}</p>
        )}
      </div>

      <div className="admin-panel-block">
        <strong className="block-title">
          <EyeOff size={14} /> Private note
        </strong>
        <p className="block-hint">Only visible to you - never shown to the client.</p>
        <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Internal notes, pricing math, reminders..." />
        <button className="btn dark" type="button" onClick={saveInternalNote} disabled={busy}>
          Save private note
        </button>
      </div>

      {ticket.statusLog?.length > 1 && (
        <div className="admin-panel-block">
          <strong className="block-title">
            <Clock3 size={14} /> Status history
          </strong>
          <ol className="status-log">
            {ticket.statusLog.map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                <span>{entry.status}</span>
                <small>{new Date(entry.at).toLocaleString()}</small>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="reply-list">
        <Reply from="GXLD" body={ticket.adminNote} at={ticket.adminNoteAt || ticket.createdAt} />
        {ticket.replies.map((entry, index) => (
          <Reply key={`${entry.at}-${index}`} {...entry} />
        ))}
      </div>
      <div className="reply-box">
        <textarea maxLength={LIMITS.reply} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to the client as GXLD." />
        <button className="btn primary" type="button" onClick={sendReply} disabled={busy}>
          <Send size={16} />
          Send Reply
        </button>
      </div>
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

const STATUS_META = {
  Open: { icon: Clock3, tone: "muted" },
  "In Review": { icon: Search, tone: "cyan" },
  Quoted: { icon: DollarSign, tone: "gold" },
  "In Progress": { icon: Hammer, tone: "violet" },
  "Ready for Delivery": { icon: Lock, tone: "amber" },
  Delivered: { icon: Unlock, tone: "green" },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Open;
  const Icon = meta.icon;
  return (
    <span className={`status-pill status-${meta.tone}`}>
      <Icon size={14} />
      {status}
    </span>
  );
}

function TicketProgress({ status }) {
  const currentIndex = Math.max(0, TICKET_STATUSES.indexOf(status));
  return (
    <ol className="ticket-progress" aria-label="Commission progress">
      {TICKET_STATUSES.map((step, index) => (
        <li key={step} className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}>
          <span className="progress-dot" aria-hidden="true" />
          <small>{step}</small>
        </li>
      ))}
    </ol>
  );
}

function PaymentInstructions({ quote }) {
  return (
    <div className="payment-instructions">
      {quote && (
        <div className="payment-amount">
          <span>Amount due</span>
          <strong>{quote}</strong>
        </div>
      )}
      <div className="payment-methods">
        <a className="pay-method" href={PAYMENT.paypal} target="_blank" rel="noopener noreferrer">
          <DollarSign size={16} />
          <span>PayPal</span>
          <small>Send as Goods &amp; Services</small>
        </a>
        <a className="pay-method" href={PAYMENT.robux} target="_blank" rel="noopener noreferrer">
          <Wallet size={16} />
          <span>Robux</span>
          <small>Group payout / gamepass</small>
        </a>
      </div>
      <p className="payment-note">
        After paying, send proof in your ticket. GXLD confirms the payment manually, then your files unlock here
        automatically. Never pay anyone else claiming to be GXLD.
      </p>
    </div>
  );
}

function ModalShell({ children, onClose, size }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const card = cardRef.current;
    const focusable = () =>
      Array.from(
        card?.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') || [],
      ).filter((el) => el.offsetParent !== null);

    focusable()[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`modal-card ${size}`}
        role="dialog"
        aria-modal="true"
        ref={cardRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ kicker, title, text }) {
  return (
    <div className="section-header reveal">
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error">
          <ShieldAlert size={26} />
          <h2>Something went wrong</h2>
          <p>The page hit an unexpected error. Reloading usually fixes it.</p>
          <button className="btn primary" type="button" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ErrorBoundary>,
);
