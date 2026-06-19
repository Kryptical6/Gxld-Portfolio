import React from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Gem,
  Layers3,
  MessageCircle,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import "./styles.css";

const work = [
  {
    title: "Futuristic Anime UI",
    tag: "Figma + Roblox Import",
    image: "/assets/futuristic-anime.jpg",
    type: "Anime",
    tone: "cyan",
  },
  {
    title: "Ancient Book Interface",
    tag: "Quest UI / Inventory",
    image: "/assets/ancient-book.jpg",
    type: "Fantasy",
    tone: "gold",
  },
  {
    title: "Frost Anime HUD",
    tag: "Game UI / Polish Pass",
    image: "/assets/frost-ui.jpg",
    type: "Frost",
    tone: "blue",
  },
  {
    title: "Neon Sci-Fi System",
    tag: "Shop / Panels / Import",
    image: "/assets/neon-scifi.jpg",
    type: "Sci-Fi",
    tone: "violet",
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

function App() {
  return (
    <main className="site-shell">
      <div className="noise" aria-hidden="true" />
      <Nav />
      <Hero />
      <Showcase />
      <Gallery />
      <Pricing />
      <Process />
      <Faq />
    </main>
  );
}

function Nav() {
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
      <a className="nav-cta" href="#contact">
        <MessageCircle size={16} />
        Let's Talk
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={14} />
          Roblox UI Designer - Available for hire
        </div>
        <h1>
          Crafting <span>bold</span>, minimal game UI for Roblox.
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
          <a className="btn ghost" href="#pricing">
            See Pricing
          </a>
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
            <strong>Featured / Live Preview</strong>
          </div>
          <img src="/assets/anime-stud.jpg" alt="Anime Roblox UI display by GXLD" />
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

function Gallery() {
  return (
    <section className="section work-section" id="work">
      <SectionHeader
        kicker="Portfolio"
        title="Past Work"
        text="A compact wall of Roblox UI displays, with the strongest pieces pulled forward for quick scanning."
      />
      <div className="work-grid">
        {work.map((item, index) => (
          <article className={`work-card tone-${item.tone} ${index < 2 ? "large" : ""}`} key={item.title}>
            <img
              src={item.image}
              alt={`${item.title} Roblox UI display`}
              decoding="async"
            />
            <div className="work-sheen" />
            <div className="work-meta">
              <span>{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.tag}</p>
            </div>
            <a
              className="work-link"
              href={item.image}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${item.title} preview`}
            >
              <ArrowRight size={16} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
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
            <a className={item.featured ? "btn primary" : "btn dark"} href="#contact">
              Start
              <ArrowRight size={16} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    ["01", "Send brief", "Share your game, style references, frames needed, and import needs."],
    ["02", "Build", "Design starts fast with progress previews and clean revision checkpoints."],
    ["03", "Deliver", "You review, approve, pay, and receive final files plus source assets."],
  ];

  return (
    <section className="section process" id="process">
      <SectionHeader
        kicker="How It Works"
        title="A clear commission flow."
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

function Faq() {
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
            <p>Send the UI frames, reference images, budget, and deadline.</p>
            <a className="btn primary" href="https://discord.com/" target="_blank" rel="noreferrer">
              <MessageCircle size={17} />
              Contact on Discord
            </a>
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

createRoot(document.getElementById("root")).render(<App />);
