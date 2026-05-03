/**
 * Marketing site for **ReelKill** (Chrome extension + `reelkill` npm/workspace name).
 *
 * Live site: https://kill.unreel.lol/
 *
 * Deploy to Cloudflare Pages (see wrangler.toml). Static only — settings live in
 * the user's browser via chrome.storage.
 *
 * Set CHROME_STORE_URL after you publish your listing.
 */

import {
  Timer,
  Zap,
  Calendar,
  ShieldCheck,
  Github,
  Sparkles,
  Globe,
  EyeOff,
  Clock,
  Lock,
  Download,
  ArrowRight,
  Camera,
  Facebook,
  PlayCircle,
} from 'lucide-react';

const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/plodaddhcjglcdbnoanjlbpadmhkdhbb?utm_source=item-share-cb';
const GITHUB_URL = 'https://github.com/njaiswal78/ReelKill';
/** Hosted policy for Chrome Web Store (also in `public/privacy.html` → `dist/`). */
const PRIVACY_POLICY_URL = '/privacy.html';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-200 selection:text-indigo-900">
      <NavBar />
      <Hero />
      <PlatformLogos />
      <Features />
      <HowItWorks />
      <Privacy />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition">
            <Timer className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold tracking-tight text-base">
            <span className="text-brand-primary">Reel</span>
            Kill
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition">Features</a>
          <a href="#how-it-works" className="hover:text-slate-900 transition">How it works</a>
          <a href="#privacy" className="hover:text-slate-900 transition">Privacy</a>
        </nav>
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition active:scale-[0.97]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* background gradient blobs */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-violet-100/60 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-bold uppercase tracking-widest text-brand-primary">
            <Sparkles className="w-3 h-3" />
            <span>Short-form blocker · Local-only · Manifest V3</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.05] text-slate-900">
            Scroll stops.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
              Night stays.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
            <strong className="text-slate-900 font-bold">ReelKill</strong> guts Shorts, Reels, TikTok FYP,
            and stray vertical traps on YouTube, Instagram, Facebook—and scrubs rogue 9:16 junk across
            everything else you browse.
          </p>
          <p className="text-base text-slate-500 leading-relaxed max-w-xl -mt-2">
            One strict-mode switch when you&apos;re serious. Office-hour schedules when you&apos;re human.
            A whitelist when you legitimately need portrait video—all stored in your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-6 py-4 rounded-2xl hover:bg-slate-800 transition active:scale-[0.98] shadow-lg shadow-slate-900/10"
            >
              <Download className="w-4 h-4" />
              <span>Get ReelKill for Chrome</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-bold px-6 py-4 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <Github className="w-4 h-4" />
              <span>Browse the source</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 shrink-0" /> Open source
            </span>
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-3 h-3 shrink-0" /> No telemetry
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 shrink-0" /> Offline-friendly
            </span>
          </div>
        </div>

        <PopupMockup />
      </div>
    </section>
  );
}

/** Static visual stand-in for the actual extension popup. */
function PopupMockup() {
  return (
    <div className="relative mx-auto max-w-[360px] w-full">
      <div className="absolute -inset-6 bg-gradient-to-br from-indigo-200/40 to-violet-200/40 rounded-[2.5rem] blur-2xl -z-10" />
      <div className="rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        {/* faux titlebar */}
        <div className="h-9 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            ReelKill
          </span>
        </div>

        {/* popup body */}
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Protection Active
            </div>
          </div>
          <div className="bg-brand-primary p-6 rounded-3xl text-white relative overflow-hidden">
            <h3 className="text-xl font-bold">Strict Mode</h3>
            <p className="text-indigo-100 text-xs mt-1 opacity-90 leading-relaxed">
              Wipes 9:16 containers from feeds globally.
            </p>
            <div className="mt-4 flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/20">
              <div className="flex flex-col">
                <span className="text-sm font-bold">On</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-100/80">
                  auto · schedule
                </span>
              </div>
              <span className="w-12 h-6 bg-white rounded-full relative flex items-center px-1">
                <span className="w-4 h-4 bg-brand-primary rounded-full ml-auto" />
              </span>
            </div>
            <Timer
              size={140}
              className="absolute -right-6 -bottom-6 stroke-[1] opacity-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-100 p-4 rounded-2xl">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Today
              </p>
              <p className="text-2xl font-black tracking-tighter">
                42<span className="text-xs ml-1 text-slate-400">blocked</span>
              </p>
            </div>
            <div className="border border-slate-100 p-4 rounded-2xl">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Saved
              </p>
              <p className="text-2xl font-black tracking-tighter">
                8<span className="text-xs ml-1 text-slate-400">min</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformLogos() {
  const items = [
    { name: 'YouTube Shorts', icon: PlayCircle, color: 'text-red-500' },
    { name: 'Instagram Reels', icon: Camera, color: 'text-pink-500' },
    { name: 'TikTok FYP', icon: PlayCircle, color: 'text-slate-900' },
    { name: 'Facebook Reels', icon: Facebook, color: 'text-blue-600' },
    { name: 'Anywhere else 9:16', icon: Globe, color: 'text-indigo-600' },
  ];
  return (
    <section className="border-y border-slate-100 bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-center text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-6">
          Detects and removes
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600"
            >
              <p.icon className={`w-4 h-4 ${p.color}`} />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Zap,
      title: 'ReelKill Strict Mode',
      body: 'One switch wipes Shorts, Reels, FYP, and every 9:16 container across sites you browse. Toggle it from the toolbar.',
    },
    {
      icon: Calendar,
      title: 'Deep-work schedule',
      body: 'Set hours when blocking is enforced automatically (e.g. Mon-Fri 9-5). Evaluated in your browser timezone, even overnight.',
    },
    {
      icon: ShieldCheck,
      title: 'Whitelist exceptions',
      body: 'Allow specific domains (vimeo.com/portfolios, your LMS, your video editor) to bypass blocking entirely.',
    },
    {
      icon: Globe,
      title: 'Universal 9:16 guard',
      body: "Walks every <video> on the page and computes its aspect ratio. Vertical content gone — even on sites you've never heard of.",
    },
    {
      icon: Clock,
      title: '7-day goal tracking',
      body: 'Set a weekly target and watch your block-count climb. Live counter on the toolbar badge. No graphs you have to study.',
    },
    {
      icon: EyeOff,
      title: 'Built for privacy',
      body: 'No accounts. No analytics. No backend. Settings ride your existing Chrome sync. Audit every line on GitHub.',
    },
  ];
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-primary mb-3">
            What it does
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
            Everything you need.
            <br />
            <span className="text-slate-400">Nothing you don't.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-7 rounded-3xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-brand-primary flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Install ReelKill',
      body: 'One click from the Chrome Web Store. No signup. ReelKill ships with sane defaults.',
    },
    {
      num: '02',
      title: 'Browse normally',
      body: 'Content scripts watch every page mutation. The moment a Reel or Short renders, it is removed before you see it.',
    },
    {
      num: '03',
      title: 'Use ReelKill daily',
      body: 'Your live toolbar counter shows blocks in real time. Open ReelKill to tweak rules, schedule, or the whitelist.',
    },
  ];
  return (
    <section id="how-it-works" className="py-24 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-primary mb-3">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
            Three steps.
            <br />
            <span className="text-slate-400">Zero configuration required.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.num} className="bg-white p-8 rounded-3xl border border-slate-100">
              <div className="text-[10px] font-bold tracking-widest text-brand-primary mb-4">
                STEP {s.num}
              </div>
              <h3 className="text-2xl font-black tracking-tighter mb-3">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Privacy() {
  return (
    <section id="privacy" className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-12 md:p-16 relative overflow-hidden">
          <div aria-hidden className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
          <Lock className="w-10 h-10 text-indigo-300 mb-6 relative" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-5 relative">
            We never see your data.
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-8 relative max-w-2xl">
            There is no backend. No accounts. No telemetry. ReelKill makes
            zero outbound network calls. Your settings live in your own
            browser's <code className="font-mono text-indigo-200">chrome.storage.sync</code>,
            attached to the Google account you already use Chrome with.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 relative">
            {[
              { label: 'No accounts', body: 'Identity is implicit via Chrome.' },
              { label: 'No tracking', body: 'No analytics SDK. No pixels.' },
              { label: 'Open source', body: 'Audit every content script yourself.' },
            ].map((p) => (
              <div key={p.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-sm font-bold text-white">{p.label}</p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-7">
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
          Get your attention back.
        </h2>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Install ReelKill in one click. Your feeds strip junk in seconds. Uninstall any time — no lock-in.
        </p>
        <div className="pt-2">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold px-7 py-4 rounded-2xl hover:bg-indigo-700 transition active:scale-[0.98] shadow-xl shadow-indigo-200"
          >
            <Download className="w-4 h-4" />
            <span>Add to Chrome — it's free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-100 py-10 space-y-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-primary rounded-md flex items-center justify-center text-white">
            <Timer className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-700">ReelKill</span>
          <span className="text-slate-300">·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-5 font-medium">
          <a href={PRIVACY_POLICY_URL} className="hover:text-slate-900 transition">
            Privacy policy
          </a>
          <a
            href={GITHUB_URL}
            className="hover:text-slate-900 transition"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          <a href={CHROME_STORE_URL} className="hover:text-slate-900 transition" target="_blank" rel="noreferrer noopener">
            Chrome Web Store
          </a>
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-400 max-w-xl mx-auto leading-relaxed px-6">
        ReelKill is independent of FocusShield Site Blocker (
        <a
          href="https://chromewebstore.google.com/detail/focusshield-site-blocker/ohdkdaaigbjnbpdljjfkpjpdbnlcbcoj"
          className="underline hover:text-slate-600"
          target="_blank"
          rel="noreferrer"
        >
          chromewebstore listing
        </a>
        ).
      </p>
    </footer>
  );
}
