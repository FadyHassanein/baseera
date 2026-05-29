"use client";

import Link from "next/link";
import type { Messages, Lang } from "@/lib/messages";

export const PHASES = [
  { id: "profile", n: "01", href: "/profile", labelKey: "phaseProfile" },
  { id: "places", n: "02", href: "/evidence", labelKey: "phasePlaces" },
  { id: "analysis", n: "03", href: "/analysis", labelKey: "phaseAnalysis" },
  { id: "report", n: "04", href: "/report", labelKey: "phaseReport" },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size, position: "relative", display: "inline-block", flexShrink: 0 }}
      aria-hidden
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: size * 0.28,
          background: "var(--color-brand)",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: size * 0.22,
          borderRadius: "50%",
          background: "var(--color-brand-light)",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size * 0.18,
          height: size * 0.18,
          marginLeft: -(size * 0.09),
          marginTop: -(size * 0.09),
          borderRadius: "50%",
          background: "var(--color-brand-dark)",
        }}
      />
    </span>
  );
}

export function PhaseTracker({
  current,
  t,
}: {
  current: PhaseId | null;
  t: Messages;
}) {
  const idx = PHASES.findIndex((p) => p.id === current);
  return (
    <nav className="flex items-center gap-0" aria-label="Phases">
      {PHASES.map((p, i) => {
        const isCurrent = p.id === current;
        const isPast = idx >= 0 && i < idx;
        const dotClass = isCurrent
          ? "bg-[var(--color-brand)] text-white ring-4 ring-[var(--color-brand-pale)]"
          : isPast
          ? "bg-[var(--color-confirmed)] text-white"
          : "bg-white text-[var(--color-ink-3)] border border-[var(--color-border-soft)]";
        const labelColor = isCurrent
          ? "text-[var(--color-brand)] font-semibold"
          : isPast
          ? "text-[var(--color-confirmed)] font-medium"
          : "text-[var(--color-ink-3)] font-medium";
        const label = t[p.labelKey] as string;
        const clickable = true;
        const Wrapper: React.ElementType = Link;
        const wrapperProps = { href: p.href };
        return (
          <div key={p.id} className="flex items-center">
            <Wrapper
              {...wrapperProps}
              className={`flex items-center gap-2.5 py-1 ${
                clickable ? "hover:opacity-80" : "opacity-60 cursor-default"
              }`}
              aria-current={isCurrent ? "page" : undefined}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-all ${dotClass}`}
              >
                {isPast ? "✓" : p.n}
              </span>
              <span className={`whitespace-nowrap text-[13px] ${labelColor}`}>
                {label}
              </span>
            </Wrapper>
            {i < PHASES.length - 1 && (
              <span
                className={`mx-3.5 inline-block h-[1.5px] w-9 ${
                  isPast ? "bg-[var(--color-confirmed)]" : "bg-[var(--color-border-soft)]"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function TopNav({
  phase,
  lang,
  setLang,
  t,
  rightSlot,
}: {
  phase: PhaseId | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Messages;
  rightSlot?: React.ReactNode;
}) {
  const isAr = lang === "ar";
  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-border-soft)] px-10 py-4 backdrop-blur-md"
      style={{ background: "rgba(250, 250, 249, 0.88)" }}
      dir={isAr ? "rtl" : "ltr"}
      lang={lang}
    >
      <div className="grid items-center gap-12" style={{ gridTemplateColumns: "auto 1fr auto" }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <BrandMark size={26} />
          <span
            className="font-display text-[22px] font-semibold leading-none tracking-[-0.01em] text-[var(--color-brand)]"
          >
            بصيرة
          </span>
          <span className="text-[var(--color-ink-3)]">·</span>
          <span
            dir="ltr"
            className="font-display text-[16px] font-medium leading-none text-[var(--color-ink-2)] group-hover:text-[var(--color-ink-1)]"
          >
            Baseera
          </span>
        </Link>

        <div className="flex justify-center">{phase && <PhaseTracker current={phase} t={t} />}</div>

        <div className="flex items-center gap-3">
          {rightSlot}
          <button
            type="button"
            onClick={() => setLang(isAr ? "en" : "ar")}
            aria-label={t.toggleLanguageAria}
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--color-border-soft)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-brand-pale)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
          >
            {isAr ? "English" : "العربية"}
          </button>
        </div>
      </div>
    </header>
  );
}
