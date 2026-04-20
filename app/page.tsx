// app/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stage {
  name: string;
  count: number;
  bg: string;
  text: string;
  border: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PIPELINE_STAGES: Stage[] = [
  { name: "Applied",    count: 142, bg: "#EEF0FF", text: "#4338CA", border: "#C7D2FE" },
  { name: "Screening",  count: 89,  bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" },
  { name: "Interview",  count: 54,  bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  { name: "Offer sent", count: 21,  bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  { name: "Hired",      count: 12,  bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
  { name: "Rejected",   count: 31,  bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  { name: "On hold",    count: 8,   bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" },
];

const SOON_CHIPS = [
  { label: "Employee management" },
  { label: "Payroll" },
  { label: "Leave tracking" },
  { label: "Onboarding flows" },
  { label: "Offer letter generation" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogoIcon({ size = 34, radius = 10 }: { size?: number; radius?: number }) {
  return (
    <div
      style={{ width: size, height: size, borderRadius: radius }}
      className="bg-indigo-500 flex items-center justify-center flex-shrink-0"
    >
      <svg width={size * 0.53} height={size * 0.53} viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.3" />
      </svg>
    </div>
  );
}

// ─── FIXED Comparison Slider ──────────────────────────────────────────────────
// Left side = Resume panel, right side = Dossier panel, each independently clipped
function ComparisonSlider() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);

  const clamp = (v: number) => Math.max(5, Math.min(95, v));

  const handleMove = (clientX: number) => {
    if (!dragging.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    setPct(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  useEffect(() => {
    const onUp = () => { dragging.current = false; };
    const onMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  return (
    <div className="max-w-[860px] mx-auto">
      <div
        ref={boxRef}
        className="relative rounded-2xl overflow-hidden border border-[#E0E7FF] shadow-[0_8px_40px_rgba(99,102,241,0.1)] select-none"
        style={{ height: 440 }}
      >
        {/* ── LEFT: Resume Panel (clipped to left of slider) ── */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        >
          <div className="absolute inset-0 bg-[#FAFAFA] p-10 flex flex-col">
            <span className="inline-block self-start text-[10px] font-medium tracking-widest uppercase bg-[#F3F4F6] text-[#6B7280] px-2.5 py-1 rounded mb-6">
              Raw resume
            </span>
            {/* Fake resume lines */}
            <div className="h-[18px] w-[55%] bg-[#D1D5DB] rounded mb-5" />
            <div className="h-[10px] w-[40%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[65%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[30%] bg-[#E5E7EB] rounded mb-5" />
            <div className="h-[12px] w-[28%] bg-[#C4B5FD] rounded mb-4" />
            <div className="h-[10px] w-[90%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[65%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[40%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[80%] bg-[#E5E7EB] rounded mb-5" />
            <div className="h-[12px] w-[28%] bg-[#C4B5FD] rounded mb-4" />
            <div className="h-[10px] w-[65%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[90%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[50%] bg-[#E5E7EB] rounded mb-2" />
            <div className="h-[10px] w-[75%] bg-[#E5E7EB] rounded mb-2" />
          </div>
        </div>

        {/* ── RIGHT: Dossier Panel (clipped to right of slider) ── */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${pct}%)` }}
        >
          <div className="absolute inset-0 bg-white p-10 flex flex-col">
            <span className="inline-block self-start text-[10px] font-medium tracking-widest uppercase bg-[#EEF0FF] text-indigo-600 px-2.5 py-1 rounded mb-6">
              AI dossier
            </span>
            {/* Identity card */}
            <div className="bg-[#F8F9FF] border border-[#E0E7FF] rounded-xl p-4 mb-3">
              <p className="text-[11px] font-semibold text-indigo-500 mb-2.5 uppercase tracking-wide">Identity verified</p>
              {[
                ["GitHub", "#059669"],
                ["LinkedIn", "#059669"],
                ["Education", "#059669"],
              ].map(([label, color]) => (
                <div key={label} className="flex justify-between mb-1.5">
                  <span className="text-[12px] text-gray-500">{label}</span>
                  <span className="text-[12px] font-medium" style={{ color }}>✓ Verified</span>
                </div>
              ))}
            </div>
            {/* Scores card */}
            <div className="bg-[#F8F9FF] border border-[#E0E7FF] rounded-xl p-4 mb-3">
              <p className="text-[11px] font-semibold text-indigo-500 mb-2.5 uppercase tracking-wide">Fit scores</p>
              {[
                ["Technical", 87],
                ["Culture", 74],
                ["JD match", 91],
              ].map(([label, val]) => (
                <div key={label as string} className="mb-2.5">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>{label}</span><span className="font-medium text-[#1E1B4B]">{val}/100</span>
                  </div>
                  <div className="h-1.5 bg-[#E0E7FF] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-300"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Rank badges */}
            <div className="flex gap-2 flex-wrap mt-1">
              <span className="text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] px-2.5 py-1 rounded-full">Rank #2 of 89</span>
              <span className="text-[10px] font-medium bg-[#EEF0FF] text-indigo-600 px-2.5 py-1 rounded-full">Score 84/100</span>
              <span className="text-[10px] font-medium bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-full">Strong fit</span>
            </div>
          </div>
        </div>

        {/* ── Divider Line ── */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${pct}%`, width: 2, background: "#6366F1", transform: "translateX(-50%)" }}
        />

        {/* ── Drag Handle ── */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center z-30 cursor-ew-resize"
          style={{ left: `${pct}%`, width: 48, transform: "translateX(-50%)" }}
          onMouseDown={(e) => { dragging.current = true; e.preventDefault(); }}
          onTouchStart={() => { dragging.current = true; }}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500 border-[3px] border-white shadow-[0_2px_16px_rgba(99,102,241,0.5)] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-[12px] text-gray-400 mt-3 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
          Raw resume
        </span>
        <span className="flex items-center gap-1">
          AI dossier
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText("talkto@agentsfactory.io");
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'DM Serif Display', serif; }

        /* ── Hero background: subtle dot-grid + gradient ── */
        .hero-bg {
          background-color: #F8F9FF;
          background-image:
            radial-gradient(circle at 70% 20%, rgba(99,102,241,0.10) 0%, transparent 45%),
            radial-gradient(circle at 15% 75%, rgba(129,140,248,0.08) 0%, transparent 40%),
            radial-gradient(#c7d2fe 1px, transparent 1px);
          background-size: auto, auto, 28px 28px;
        }

        /* floating cards in hero */
        .hero-card {
          animation: float 5s ease-in-out infinite;
          backdrop-filter: blur(8px);
        }
        .hero-card-2 { animation-delay: -2.5s; }
        .hero-card-3 { animation-delay: -1.2s; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }

        /* pipeline dot */
        .pipeline-dot { transition: transform 0.15s; }
        .pipeline-dot:hover { transform: scale(1.15); }

        /* feature card hover */
        .feat-card { transition: box-shadow 0.2s, transform 0.2s; }
        .feat-card:hover { box-shadow: 0 8px 32px rgba(99,102,241,0.1); transform: translateY(-2px); }

        /* buttons */
        .btn-primary-lp { transition: background 0.2s, transform 0.15s; }
        .btn-primary-lp:hover { background: #4F46E5 !important; transform: translateY(-1px); }
        .btn-ghost-lp { transition: border-color 0.2s, background 0.2s; }
        .btn-ghost-lp:hover { border-color: #818CF8 !important; background: #EEF0FF !important; }
        .nav-login-btn { transition: background 0.2s; }
        .nav-login-btn:hover { background: #4F46E5 !important; }

        /* step watermark */
        .step-watermark {
          position: absolute; top: -10px; right: 16px;
          font-family: 'DM Serif Display', serif;
          font-size: 72px; line-height: 1;
          color: #EEF0FF; pointer-events: none;
        }

        /* coming-soon chip hover */
        .soon-chip { transition: background 0.2s, border-color 0.2s, transform 0.15s; cursor: default; }
        .soon-chip:hover { background: rgba(99,102,241,0.25) !important; transform: translateY(-1px); }

        /* contact copy button */
        .copy-btn { transition: background 0.2s, transform 0.15s; }
        .copy-btn:hover { background: #DDE1FF !important; transform: translateY(-1px); }

        /* bottom section split */
        .bottom-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 768px) {
          .bottom-split { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-[#1E1B4B] overflow-x-hidden">

        {/* ── NAV ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] h-[68px] bg-white/90 backdrop-blur-md border-b border-[#E0E7FF]">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0"
          >
            <LogoIcon size={34} radius={10} />
            <span className="text-[15px] font-medium text-[#1E1B4B]">Workfolio HRM</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium text-indigo-600 bg-[#EEF0FF] border border-[#E0E7FF] rounded-full px-3 py-1">
              Early Access
            </span>
            <button
              onClick={() => router.push("/login")}
              className="nav-login-btn text-[13px] font-medium text-white bg-indigo-500 rounded-[10px] px-5 py-2 cursor-pointer border-none"
            >
              Sign in
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero-bg relative min-h-screen flex flex-col items-center justify-center px-[5%] pt-[100px] pb-[80px] text-center overflow-hidden">

          {/* Decorative geometric shapes */}
          <div className="absolute top-[80px] left-[5%] w-32 h-32 rounded-2xl border border-[#C7D2FE] rotate-12 opacity-60 pointer-events-none" />
          <div className="absolute bottom-[120px] right-[7%] w-20 h-20 rounded-full border border-[#C7D2FE] opacity-50 pointer-events-none" />
          <div className="absolute top-[160px] right-[12%] w-8 h-8 rounded bg-[#EEF0FF] rotate-45 opacity-80 pointer-events-none" />
          <div className="absolute bottom-[200px] left-[10%] w-5 h-5 rounded bg-[#DDD6FE] opacity-70 pointer-events-none" />

          {/* Floating cards */}
          <div className="hero-card absolute top-[110px] right-[6%] bg-white/90 border border-[#E0E7FF] rounded-2xl px-4 py-3 shadow-[0_4px_20px_rgba(99,102,241,0.10)] hidden lg:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-sm">✓</div>
            <div>
              <div className="text-[11px] font-semibold text-[#1E1B4B]">Strong fit — Rank #2</div>
              <div className="text-[10px] text-gray-400">Score 84/100 · JD match 91%</div>
            </div>
          </div>

          <div className="hero-card hero-card-2 absolute bottom-[140px] right-[8%] bg-white/90 border border-[#E0E7FF] rounded-2xl px-4 py-3 shadow-[0_4px_20px_rgba(99,102,241,0.10)] hidden lg:block">
            <div className="text-[10px] text-indigo-500 font-medium mb-1.5 uppercase tracking-wide">GitHub signals</div>
            {["Active contributor", "8 public repos", "4.2k commits"].map(s => (
              <div key={s} className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[11px] text-gray-600">{s}</span>
              </div>
            ))}
          </div>

          <div className="hero-card hero-card-3 absolute top-[140px] left-[6%] bg-white/90 border border-[#E0E7FF] rounded-2xl px-4 py-3 shadow-[0_4px_20px_rgba(99,102,241,0.10)] hidden lg:block">
            <div className="text-[10px] text-indigo-500 font-medium mb-1.5 uppercase tracking-wide">Pipeline today</div>
            {[
              { label: "Applied", n: 142, color: "#6366F1" },
              { label: "Interview", n: 54, color: "#7C3AED" },
              { label: "Hired", n: 12, color: "#10B981" },
            ].map(({ label, n, color }) => (
              <div key={label} className="flex justify-between items-center gap-4 mb-1">
                <span className="text-[11px] text-gray-500">{label}</span>
                <span className="text-[11px] font-semibold" style={{ color }}>{n}</span>
              </div>
            ))}
          </div>

          {/* Main copy */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 bg-[#EEF0FF] border border-[#E0E7FF] rounded-full px-3.5 py-1.5 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              AI-Powered Recruitment Intelligence
            </div>
            <h1 className="font-display text-[clamp(44px,7vw,84px)] leading-[1.06] text-[#1E1B4B] mb-4">
              Hire with<br />
              <em className="text-indigo-500 not-italic">absolute certainty.</em>
            </h1>
            <p className="text-[clamp(15px,2vw,18px)] text-gray-500 max-w-[560px] leading-[1.7] mb-10">
              Upload resumes. Get deep candidate dossiers with GitHub analysis, LinkedIn verification, and a ranked shortlist — all explained.
            </p>
            <div className="flex gap-3.5 justify-center flex-wrap">
              <button
                onClick={() => router.push("/login")}
                className="btn-primary-lp inline-flex items-center gap-2 text-[14px] font-medium text-white bg-indigo-500 rounded-[12px] px-7 py-3.5 cursor-pointer border-none"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Request demo access
              </button>
              <a
                href="#how"
                className="btn-ghost-lp inline-flex items-center gap-2 text-[14px] font-medium text-[#1E1B4B] bg-transparent border-[1.5px] border-[#E0E7FF] rounded-[12px] px-6 py-3.5 no-underline"
              >
                See how it works
              </a>
            </div>

            {/* Mini trust strip under CTA */}
            <div className="flex items-center gap-5 mt-8 text-[12px] text-gray-400 flex-wrap justify-center">
              <span className="flex items-center gap-1"><span className="text-[#10B981]">✓</span> No credit card</span>
              <span className="flex items-center gap-1"><span className="text-[#10B981]">✓</span> PDF &amp; DOCX support</span>
              <span className="flex items-center gap-1"><span className="text-[#10B981]">✓</span> Decisions explained</span>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <div className="flex justify-center gap-12 flex-wrap px-[5%] py-8 border-t border-b border-[#E0E7FF] bg-white">
          {[
            { num: "2-phase", label: "scoring pipeline" },
            { num: "5+ signals", label: "per candidate" },
            { num: "100%", label: "decisions explained" },
            { num: "PDF/DOCX", label: "resume support" },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="text-[26px] font-semibold text-[#1E1B4B]">{num}</div>
              <div className="text-[12px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="bg-[#F8F9FF] px-[5%] py-20">
          <div className="max-w-[960px] mx-auto">
            <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-indigo-500 mb-3">How it works</p>
            <h2 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.2] text-[#1E1B4B] mb-3">
              From resume to ranked shortlist
            </h2>
            <p className="text-[15px] text-gray-500 max-w-[540px] leading-[1.7] mb-12">
              Four steps. Zero manual effort. Full transparency on every decision.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  n: "01", title: "Upload resumes",
                  desc: "Drop PDF or DOCX files. Our parser extracts structured data, contact links, and social profiles automatically.",
                  badge: "Docling-powered", badgeBg: "#EEF0FF", badgeText: "#4338CA",
                  iconBg: "#EEF0FF",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="4" y="2" width="12" height="16" rx="2" stroke="#6366F1" strokeWidth="1.5" />
                      <path d="M7 7h6M7 10h6M7 13h4" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  n: "02", title: "AI dossier generation",
                  desc: "Deep agent investigates GitHub contributions, verifies LinkedIn, cross-checks education, and scores soft signals.",
                  badge: "Agentic AI", badgeBg: "#EDE9FE", badgeText: "#5B21B6",
                  iconBg: "#EDE9FE",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="#7C3AED" strokeWidth="1.5" />
                      <path d="M10 6v4l2.5 2.5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  n: "03", title: "2-phase shortlisting",
                  desc: "Phase 1 filters by hard rules from your JD. Phase 2 scores remaining candidates from multiple perspectives.",
                  badge: "JD-matched", badgeBg: "#FEF3C7", badgeText: "#92400E",
                  iconBg: "#FEF3C7",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 15l4-4 3 3 5-7" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  n: "04", title: "Ranked results",
                  desc: "Every shortlisted candidate gets a rank, score breakdown, and plain-English reasoning you can share with your team.",
                  badge: "Fully explained", badgeBg: "#D1FAE5", badgeText: "#065F46",
                  iconBg: "#D1FAE5",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 10l4 4 6-6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="relative bg-white border border-[#E0E7FF] rounded-2xl p-7 overflow-hidden"
                >
                  <span className="step-watermark">{s.n}</span>
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4"
                    style={{ background: s.iconBg }}
                  >
                    {s.icon}
                  </div>
                  <div className="text-[15px] font-medium text-[#1E1B4B] mb-1.5">{s.title}</div>
                  <div className="text-[13px] text-gray-500 leading-[1.6]">{s.desc}</div>
                  <span
                    className="inline-block text-[10px] font-medium px-2.5 py-1 rounded-full mt-3"
                    style={{ background: s.badgeBg, color: s.badgeText }}
                  >
                    {s.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON SLIDER ── */}
        <section id="compare" className="bg-white px-[5%] py-20">
          <div className="max-w-[960px] mx-auto">
            <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-indigo-500 mb-3">Before vs after</p>
            <h2 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.2] text-[#1E1B4B] mb-3">
              Resume in. Dossier out.
            </h2>
            <p className="text-[15px] text-gray-500 max-w-[540px] leading-[1.7] mb-12">
              Drag the slider to see what our AI extracts — structured data, scored signals, and a final rank.
            </p>
            <ComparisonSlider />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="bg-white px-[5%] py-20">
          <div className="max-w-[960px] mx-auto">
            <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-indigo-500 mb-3">Capabilities</p>
            <h2 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.2] text-[#1E1B4B] mb-3">
              What&apos;s inside the platform
            </h2>
            <p className="text-[15px] text-gray-500 max-w-[540px] leading-[1.7] mb-12">
              Every feature is built around one goal — getting you to the right hire faster.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  title: "Resume parsing",
                  desc: "Docling-powered extraction from PDF and DOCX — structured data, links, and social handles pulled automatically.",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="3" y="2" width="12" height="14" rx="2" stroke="#6366F1" strokeWidth="1.4" />
                      <path d="M6 6h6M6 9h6M6 12h4" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: "GitHub code analysis",
                  desc: "Evaluates real commit history, repo activity, and code quality signals — not just a linked profile.",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="6" stroke="#6366F1" strokeWidth="1.4" />
                      <path d="M9 6v3l2 2" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: "LinkedIn verification",
                  desc: "Cross-checks claimed roles, tenure, and connections against public LinkedIn data for authenticity.",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 3a6 6 0 100 12A6 6 0 009 3z" stroke="#6366F1" strokeWidth="1.4" />
                      <path d="M9 3c-2 2-2 8 0 12M9 3c2 2 2 8 0 12M3 9h12" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: "2-phase scoring",
                  desc: "Hard-rule filtering followed by multi-dimensional AI scoring — both phases fully auditable.",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 13l3.5-3.5 2.5 2.5 4-5" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  title: "Explainable decisions",
                  desc: "Every shortlist decision comes with plain-English reasoning — no black box, no guessing.",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="3" y="8" width="12" height="7" rx="1.5" stroke="#6366F1" strokeWidth="1.4" />
                      <path d="M6 8V6a3 3 0 016 0v2" stroke="#6366F1" strokeWidth="1.4" strokeLinecap="round" />
                      <circle cx="9" cy="11.5" r="1" fill="#6366F1" />
                    </svg>
                  ),
                },
                {
                  title: "JD-based shortlisting",
                  desc: "Paste your job description — the system aligns every candidate score to your exact requirements.",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#6366F1" strokeWidth="1.4" />
                      <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#6366F1" strokeWidth="1.4" />
                      <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#6366F1" strokeWidth="1.4" />
                      <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#6366F1" strokeWidth="1.4" />
                    </svg>
                  ),
                },
              ].map(({ title, desc, icon }) => (
                <div key={title} className="feat-card border border-[#E0E7FF] rounded-2xl p-6 bg-white">
                  <div className="w-9 h-9 rounded-[10px] bg-[#EEF0FF] flex items-center justify-center mb-3.5">
                    {icon}
                  </div>
                  <div className="text-[14px] font-medium text-[#1E1B4B] mb-1.5">{title}</div>
                  <div className="text-[13px] text-gray-500 leading-[1.6]">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMING SOON + CONTACT (split left/right) ── */}
        <section className="bottom-split min-h-[420px]">

          {/* LEFT: Coming Soon */}
<div className="bg-[#1E1B4B] px-[8%] py-16 flex flex-col justify-center">
  <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#A5B4FC] mb-3">Coming soon</p>
  <h2 className="font-display text-[clamp(24px,3vw,34px)] text-[#E0E7FF] mb-3 leading-[1.2]">
    Full HRM,<br />on the horizon.
  </h2>
  <p className="text-[14px] text-[#A5B4FC] leading-[1.7] mb-8 max-w-[360px]">
    We&apos;re launching with deep recruitment intelligence. The rest of the suite is on its way — stay tuned.
  </p>
  <div className="flex flex-col gap-2.5">
    {SOON_CHIPS.map((chip, i) => (
      <div
        key={chip.label}
        className="soon-chip flex items-center gap-3 border border-indigo-500/25 rounded-xl px-4 py-2.5"
        style={{ background: "rgba(99,102,241,0.12)" }}
      >
        {/* Dot Indicator */}
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
        
        <span className="text-[13px] font-medium text-[#C7D2FE]">{chip.label}</span>
        <span className="ml-auto text-[10px] text-indigo-400 border border-indigo-500/25 rounded-full px-2 py-0.5">
          {i === 0 ? "Q3 2026" : i === 1 ? "Q3 2026" : "Q4 2026"}
        </span>
      </div>
    ))}
  </div>
</div>

          {/* RIGHT: Contact */}
          <div className="bg-[#F8F9FF] px-[8%] py-16 flex flex-col justify-center border-l border-[#E0E7FF]">
            <div className="w-12 h-12 rounded-full bg-[#EEF0FF] flex items-center justify-center mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 7l-9 7-9-7" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6366F1" strokeWidth="1.5" />
              </svg>
            </div>
            <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-indigo-500 mb-2">Get early access</p>
            <h3 className="font-display text-[clamp(24px,3vw,34px)] text-[#1E1B4B] mb-3 leading-[1.2]">
              Let&apos;s get you<br />set up.
            </h3>
            <p className="text-[14px] text-gray-500 leading-[1.7] mb-7 max-w-[340px]">
              Want demo credentials or a platform walkthrough? Drop us a line — we respond within a business day.
            </p>

            {/* Email block with copy */}
            <div className="bg-white border border-[#E0E7FF] rounded-2xl p-5 mb-4">
              <p className="text-[11px] text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Email us at</p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[15px] font-medium text-[#1E1B4B]">talkto@agentsfactory.io</span>
                <div className="flex gap-2">
                  <button
                    onClick={copyEmail}
                    className="copy-btn text-[12px] font-medium text-indigo-600 bg-[#EEF0FF] border border-[#E0E7FF] rounded-lg px-3 py-1.5 cursor-pointer border-none flex items-center gap-1.5"
                  >
                    {emailCopied ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <rect x="4" y="1" width="7" height="8" rx="1" stroke="#6366F1" strokeWidth="1.2" />
                          <rect x="1" y="3" width="7" height="8" rx="1" stroke="#6366F1" strokeWidth="1.2" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <a
                    href="mailto:talkto@agentsfactory.io"
                    className="copy-btn text-[12px] font-medium text-indigo-600 bg-[#EEF0FF] border border-[#E0E7FF] rounded-lg px-3 py-1.5 no-underline flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 3h8l-4 4-4-4z" stroke="#6366F1" strokeWidth="1.1" strokeLinejoin="round" />
                      <path d="M2 3v6h8V3" stroke="#6366F1" strokeWidth="1.1" strokeLinejoin="round" />
                    </svg>
                    Open mail
                  </a>
                </div>
              </div>
            </div>

            {/* Trust signals */}
            <div className="flex gap-4 flex-wrap">
              {["Responds within 24h", "No sales pressure", "Free walkthrough"].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-[12px] text-gray-400">
                  <span className="text-[#10B981]">✓</span> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-[#E0E7FF] px-[5%] py-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <LogoIcon size={28} radius={8} />
            <span className="text-[13px] font-medium text-[#1E1B4B]">Workfolio HRM</span>
          </div>
          <p className="text-[12px] text-gray-400">
            © 2026 Agents Factory. All rights reserved.
          </p>
        </footer>

      </div>
    </>
  );
}