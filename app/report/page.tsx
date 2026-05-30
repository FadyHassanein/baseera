"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { messages, type Lang, type Messages } from "@/lib/messages";
import { useLang } from "@/lib/use-lang";
import { TopNav } from "@/components/chrome";
import {
  BORDER_BY_STATE,
  ConfidenceBadge,
  stateLabel,
} from "@/components/confidence";
import { labelFor } from "@/lib/vocabulary";
import {
  loadProfile,
  loadEvidence,
  loadReport,
  saveReport,
  clearAll,
  type StoredEvidence,
} from "@/lib/storage";
import { generateReport } from "../actions";
import type { Profile } from "@/lib/schema";
import type { Report, Verdict, Risk, SourceRefSchema } from "@/lib/reportSchema";
import type { z } from "zod";

type SourceRef = z.infer<typeof SourceRefSchema>;

type FilterId = "all" | "confirmed" | "uncertain" | "unknown" | "inadequate";

type LoadState =
  | { phase: "init" }
  | { phase: "missing-profile" }
  | { phase: "missing-evidence" }
  | { phase: "generating"; profile: Profile; evidence: StoredEvidence[] }
  | { phase: "error"; profile: Profile; evidence: StoredEvidence[]; error: string }
  | {
      phase: "ready";
      profile: Profile;
      evidence: StoredEvidence[];
      report: Report;
    };

export default function ReportPage() {
  const [lang, setLang] = useLang();
  const t = messages[lang];
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ phase: "init" });
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      setState({ phase: "missing-profile" });
      return;
    }
    const evidence = loadEvidence();
    if (evidence.length === 0) {
      setState({ phase: "missing-evidence" });
      return;
    }
    const cached = loadReport();
    if (cached) {
      setState({ phase: "ready", profile, evidence, report: cached });
      return;
    }
    setState({ phase: "generating", profile, evidence });
    generateReport(profile, evidence.map((e) => e.evidence), null).then((res) => {
      if (!res.ok) {
        setState({ phase: "error", profile, evidence, error: res.error });
      } else {
        saveReport(res.report);
        setState({ phase: "ready", profile, evidence, report: res.report });
      }
    });
  }, []);

  function retry() {
    if (state.phase !== "error") return;
    const { profile, evidence } = state;
    setState({ phase: "generating", profile, evidence });
    generateReport(profile, evidence.map((e) => e.evidence), null).then((res) => {
      if (!res.ok) {
        setState({ phase: "error", profile, evidence, error: res.error });
      } else {
        saveReport(res.report);
        setState({ phase: "ready", profile, evidence, report: res.report });
      }
    });
  }

  function handleStartOver() {
    clearAll();
    router.push("/");
  }

  const isAr = lang === "ar";

  return (
    <>
      <TopNav phase="report" lang={lang} setLang={setLang} t={t} />
      <main
        dir={isAr ? "rtl" : "ltr"}
        lang={lang}
        className="mx-auto max-w-[1240px] px-10 py-11 pb-32"
      >
        {state.phase === "init" || state.phase === "generating" ? (
          <Loading t={t} />
        ) : state.phase === "missing-profile" ? (
          <EmptyState
            message={t.reportPlaceholderProfile}
            actionLabel={t.reportGoToProfile}
            href="/profile"
            isAr={isAr}
          />
        ) : state.phase === "missing-evidence" ? (
          <EmptyState
            message={t.reportPlaceholderEvidence}
            actionLabel={t.reportGoToPlaces}
            href="/evidence"
            isAr={isAr}
          />
        ) : state.phase === "error" ? (
          <ErrorState
            message={t.reportFailed}
            detail={state.error}
            retryLabel={t.reportRetry}
            onRetry={retry}
          />
        ) : (
          <ReportContent
            report={state.report}
            evidence={state.evidence}
            t={t}
            lang={lang}
            filter={filter}
            setFilter={setFilter}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </>
  );
}

function Loading({ t }: { t: Messages }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 text-center">
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--color-surface)] px-5 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full bg-[var(--color-brand)] animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p className="font-display text-[22px] text-[var(--color-ink-2)]">{t.reportGenerating}</p>
    </div>
  );
}

function EmptyState({
  message,
  actionLabel,
  href,
  isAr,
}: {
  message: string;
  actionLabel: string;
  href: string;
  isAr: boolean;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 text-center">
      <p className="max-w-[480px] text-[17px] leading-[1.6] text-[var(--color-ink-2)]">{message}</p>
      <Link
        href={href}
        className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-[15px] font-medium text-white hover:bg-[var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
      >
        {actionLabel} <span aria-hidden>{isAr ? "←" : "→"}</span>
      </Link>
    </div>
  );
}

function ErrorState({
  message,
  detail,
  retryLabel,
  onRetry,
}: {
  message: string;
  detail: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 text-center">
      <p className="max-w-[480px] text-[17px] text-[var(--color-inadequate-text)]">{message}</p>
      <p className="max-w-[640px] text-[13px] text-[var(--color-ink-3)] font-mono">{detail}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center rounded-md border border-[var(--color-border-soft)] bg-white px-5 py-2 text-sm font-medium text-[var(--color-ink-1)] hover:bg-[var(--color-brand-pale)]"
      >
        {retryLabel}
      </button>
    </div>
  );
}

function ReportContent({
  report,
  evidence,
  t,
  lang,
  filter,
  setFilter,
  onStartOver,
}: {
  report: Report;
  evidence: StoredEvidence[];
  t: Messages;
  lang: Lang;
  filter: FilterId;
  setFilter: (f: FilterId) => void;
  onStartOver: () => void;
}) {
  const filteredVerdicts =
    filter === "all" ? report.verdicts : report.verdicts.filter((v) => v.state === filter);

  return (
    <>
      <div className="mb-8">
        <div className="font-mono text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-brand)]">
          {t.phaseReport} · 04 / 04
        </div>
        <h1 className="font-display mt-3 text-[44px] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--color-ink-1)]">
          {report.place_name || t.reportTitle}
        </h1>
        <p className="mt-3 max-w-[720px] text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
          {t.reportSubtitle}
        </p>
      </div>

      <ResilienceHero report={report} t={t} />

      {report.risks.length > 0 && <RisksCallout risks={report.risks} t={t} lang={lang} />}

      <ReportTabs filter={filter} setFilter={setFilter} counts={report.counts} total={report.verdicts.length} t={t} />

      <div className="mt-6 flex flex-col gap-3">
        {filteredVerdicts.map((v, i) => (
          <VerdictCard key={i} verdict={v} evidence={evidence} t={t} lang={lang} />
        ))}
      </div>

      {report.draft_message && (
        <DraftMessageCard draft={report.draft_message} t={t} lang={lang} />
      )}

      <HonestyFooter t={t} />

      <ActionBar t={t} onStartOver={onStartOver} hasDraft={report.draft_message !== null} />
    </>
  );
}

function ResilienceHero({ report, t }: { report: Report; t: Messages }) {
  return (
    <div
      className="relative mb-5 overflow-hidden rounded-2xl text-white"
      style={{ background: "var(--color-ink-1)" }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: -100,
          right: -80,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,164,133,.18) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <div
        className="relative grid items-center gap-12 px-10 py-9"
        style={{ gridTemplateColumns: "auto 1fr auto" }}
      >
        <div
          className="font-display font-semibold leading-[0.86] tracking-[-0.04em]"
          style={{ fontSize: 148, color: "var(--color-brand-light)" }}
        >
          {report.resilience_score}
        </div>
        <div>
          <div className="font-mono mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-white/50">
            {t.reportScoreLabel}
          </div>
          <p className="font-display m-0 max-w-[540px] text-[24px] font-normal leading-[1.35]">
            {report.summary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-6 text-[13px]">
            <ScoreStat label={t.reportTabConfirmed} value={report.counts.confirmed} color="var(--color-confirmed)" />
            <ScoreStat label={t.reportTabUncertain} value={report.counts.uncertain} color="var(--color-uncertain)" />
            <ScoreStat label={t.reportTabUnknown} value={report.counts.unknown} color="rgba(255,255,255,.55)" />
            {report.counts.inadequate > 0 && (
              <ScoreStat label={t.reportTabInadequate} value={report.counts.inadequate} color="var(--color-inadequate)" />
            )}
          </div>
        </div>
        <div
          className="rounded-[14px] border border-white/15 px-4 py-5 text-center"
          style={{ width: 150 }}
        >
          <div className="font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-white/45">
            {t.reportRating}
          </div>
          <div className="font-display mt-1 text-[28px] font-semibold leading-tight text-[var(--color-brand-light)]">
            {report.rating}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} aria-hidden />
      <span className="text-white/60">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </span>
  );
}

function RisksCallout({ risks, t, lang }: { risks: Risk[]; t: Messages; lang: Lang }) {
  return (
    <div
      className="mb-5 rounded-2xl px-7 py-6"
      style={{
        background: "var(--color-uncertain-bg)",
        border: "1px solid var(--color-uncertain-border)",
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{ background: "var(--color-uncertain)" }}
        >
          !
        </span>
        <span
          className="text-[14px] font-semibold"
          style={{ color: "var(--color-uncertain-text)" }}
        >
          {t.reportRisksTitle}
        </span>
        <span
          className="font-mono text-[11px] tracking-[0.06em] uppercase opacity-70"
          style={{ color: "var(--color-uncertain-text)" }}
        >
          · {t.reportRisksSubtitle}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {risks.map((risk, i) => (
          <div
            key={i}
            className="rounded-[10px] bg-white px-4 py-4"
            style={{ border: "1px solid var(--color-uncertain-border)" }}
          >
            <div
              className="mb-1.5 text-[13px] font-semibold"
              style={{ color: "var(--color-uncertain-text)" }}
            >
              {labelFor("dimension", risk.dimension, lang)}
            </div>
            <p className="m-0 mb-3 text-[13px] leading-[1.55] text-[var(--color-ink-2)]">
              {risk.body}
            </p>
            <div
              className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase"
              style={{ color: "var(--color-brand)" }}
            >
              → {risk.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTabs({
  filter,
  setFilter,
  counts,
  total,
  t,
}: {
  filter: FilterId;
  setFilter: (f: FilterId) => void;
  counts: Report["counts"];
  total: number;
  t: Messages;
}) {
  const tabs: { id: FilterId; label: string; count: number }[] = [
    { id: "all", label: t.reportTabAll, count: total },
    { id: "confirmed", label: t.reportTabConfirmed, count: counts.confirmed },
    { id: "uncertain", label: t.reportTabUncertain, count: counts.uncertain },
    { id: "unknown", label: t.reportTabUnknown, count: counts.unknown },
    ...(counts.inadequate > 0
      ? [{ id: "inadequate" as FilterId, label: t.reportTabInadequate, count: counts.inadequate }]
      : []),
  ];
  return (
    <div className="mt-7 flex flex-wrap items-center gap-0 border-b border-[var(--color-border-soft)]">
      {tabs.map((tab) => {
        const active = filter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] ${
              active
                ? "border-[var(--color-brand)] text-[var(--color-ink-1)] font-semibold"
                : "border-transparent text-[var(--color-ink-3)] font-normal hover:text-[var(--color-ink-1)]"
            }`}
            style={{ marginBottom: -1 }}
          >
            {tab.label}
            <span
              className={`font-mono rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                active
                  ? "bg-[var(--color-brand-pale)] text-[var(--color-brand-dark)]"
                  : "bg-[var(--color-surface)] text-[var(--color-ink-3)]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function VerdictCard({
  verdict,
  evidence,
  t,
  lang,
}: {
  verdict: Verdict;
  evidence: StoredEvidence[];
  t: Messages;
  lang: Lang;
}) {
  return (
    <article
      className={`rounded-r-md border border-[var(--color-border-soft)] border-l-4 ${BORDER_BY_STATE[verdict.state]} bg-white p-5 shadow-sm`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[var(--color-ink-3)]">
            {labelFor("dimension", verdict.dimension, lang)}
          </span>
          <h3 className="font-display mt-1 text-[18px] font-medium leading-[1.3] text-[var(--color-ink-1)]">
            {verdict.headline}
          </h3>
        </div>
        <ConfidenceBadge
          state={verdict.state}
          pct={verdict.confidence}
          label={stateLabel(verdict.state, t)}
        />
      </div>
      <p className="m-0 mb-3 text-[14.5px] leading-[1.6] text-[var(--color-ink-2)]">{verdict.body}</p>
      {verdict.source_refs.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-[0.06em] uppercase text-[var(--color-ink-3)]">
            {t.reportSources}:
          </span>
          {verdict.source_refs.map((ref, i) => (
            <SourceChip key={i} ref_={ref} evidence={evidence} t={t} />
          ))}
        </div>
      )}
      {verdict.next_question && (
        <div
          className="mt-4 rounded-[10px] px-4 py-3"
          style={{ background: "var(--color-brand-pale)", border: "1px solid var(--color-brand-light)" }}
        >
          <div className="font-mono mb-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[var(--color-brand-dark)]">
            {t.reportNextQuestion}
          </div>
          <p className="m-0 text-[14px] leading-[1.55] text-[var(--color-brand-dark)]">
            {verdict.next_question}
          </p>
        </div>
      )}
    </article>
  );
}

function SourceChip({
  ref_,
  evidence,
  t,
}: {
  ref_: SourceRef;
  evidence: StoredEvidence[];
  t: Messages;
}) {
  let label = "";
  if (ref_.kind === "photo") {
    const idx = ref_.index ?? 0;
    const filename = evidence[idx - 1]?.fileName;
    label = `${t.reportSourcePhoto} ${idx}${filename ? ` · ${filename}` : ""}`;
  } else if (ref_.kind === "narrative") {
    label = t.reportSourceNarrative;
  } else {
    label = `${t.reportSourceInferred}${ref_.note ? ` · ${ref_.note}` : ""}`;
  }
  return (
    <span
      className="font-mono rounded-md bg-[var(--color-surface)] px-2 py-1 text-[10px] uppercase tracking-[0.04em] text-[var(--color-ink-3)]"
      title={ref_.note ?? undefined}
    >
      {label}
    </span>
  );
}

function DraftMessageCard({
  draft,
  t,
  lang,
}: {
  draft: NonNullable<Report["draft_message"]>;
  t: Messages;
  lang: Lang;
}) {
  function handleCopy() {
    const text = (draft.subject ? `${draft.subject}\n\n` : "") + draft.body;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
  }

  function whatsappHref() {
    const text = encodeURIComponent(
      (draft.subject ? `${draft.subject}\n\n` : "") + draft.body
    );
    return `https://wa.me/?text=${text}`;
  }

  const isAr = lang === "ar";

  return (
    <section
      className="mt-8 rounded-2xl px-7 py-6"
      style={{
        background: "var(--color-brand-pale)",
        border: "1px solid var(--color-brand-light)",
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--color-brand-dark)]">
            {t.reportDraftTitle}
          </div>
          {draft.subject && (
            <div className="mt-1.5 text-[13px] text-[var(--color-brand-dark)]">{draft.subject}</div>
          )}
        </div>
      </div>
      <p
        className="font-display m-0 italic text-[16px] leading-[1.7]"
        style={{ color: "var(--color-brand-dark)" }}
      >
        {draft.body}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-dark)]"
        >
          {t.reportDraftSend}
          <span aria-hidden>{isAr ? "←" : "→"}</span>
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--color-brand-light)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-pale)]"
        >
          {t.reportDraftCopy}
        </button>
      </div>
    </section>
  );
}

function HonestyFooter({ t }: { t: Messages }) {
  return (
    <div className="mt-10 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-7 py-6">
      <p className="m-0 max-w-[720px] text-[13.5px] leading-[1.7] text-[var(--color-ink-2)]">
        {t.reportFooterHonesty}
      </p>
    </div>
  );
}

function ActionBar({
  t,
  onStartOver,
  hasDraft,
}: {
  t: Messages;
  onStartOver: () => void;
  hasDraft: boolean;
}) {
  return (
    <div
      className="sticky bottom-6 mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,.35)]"
      style={{ background: "var(--color-ink-1)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--color-confirmed)" }}
          aria-hidden
        />
        <span className="text-[14px] font-medium">{t.actionBarReady}</span>
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-md border border-white/25 bg-transparent px-3.5 py-2 text-[13px] text-white hover:bg-white/10"
        >
          {t.startOver}
        </button>
        {hasDraft && (
          <button
            type="button"
            className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-brand-dark)]"
          >
            {t.actionBarSendAll}
          </button>
        )}
      </div>
    </div>
  );
}
