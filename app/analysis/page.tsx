"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { messages, type Lang, type Messages } from "@/lib/messages";
import { TopNav } from "@/components/chrome";
import {
  loadProfile,
  loadEvidence,
  saveReport,
  type StoredEvidence,
} from "@/lib/storage";
import { generateReport } from "../actions";
import type { Profile } from "@/lib/schema";

type Phase = "init" | "running" | "done" | "error" | "missing";

export default function AnalysisPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = messages[lang];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("init");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const tickStartRef = useRef<number>(0);

  function addLog(level: LogEntry["level"], text: string) {
    const elapsed = (performance.now() - tickStartRef.current) / 1000;
    setLogs((prev) => [...prev, { ts: elapsed, level, text }]);
  }

  useEffect(() => {
    const profile = loadProfile();
    const evidence = loadEvidence();
    if (!profile || evidence.length === 0) {
      setPhase("missing");
      return;
    }
    runAnalysis(profile, evidence);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runAnalysis(profile: Profile, evidence: StoredEvidence[]) {
    setPhase("running");
    tickStartRef.current = performance.now();
    setLogs([]);
    setProgress(0);
    setStep(0);

    addLog("info", `Reading ${evidence.length} place photo${evidence.length === 1 ? "" : "s"}`);
    evidence.forEach((e, i) => {
      setTimeout(() => {
        addLog(
          "ok",
          `Photo ${i + 1} — ${e.evidence.findings.length} finding${e.evidence.findings.length === 1 ? "" : "s"}: ${e.fileName}`
        );
      }, 250 + i * 350);
    });

    const stepInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 96) return p;
        return p + 1.2;
      });
    }, 110);

    const stepTimers = [
      setTimeout(() => {
        setStep(1);
        addLog("info", "Matching to your needs profile");
      }, 1500),
      setTimeout(() => {
        setStep(2);
        addLog("info", "Identifying information gaps");
      }, 3200),
      setTimeout(() => {
        setStep(3);
        addLog("info", "Generating the confidence report");
      }, 4800),
    ];

    generateReport(
      profile,
      evidence.map((e) => e.evidence),
      null
    ).then((res) => {
      stepTimers.forEach((tt) => clearTimeout(tt));
      clearInterval(stepInterval);

      if (!res.ok) {
        addLog("err", res.error);
        setErrorDetail(res.error);
        setPhase("error");
        return;
      }

      saveReport(res.report);
      setProgress(100);
      setStep(3);
      addLog(
        "ok",
        `${res.report.rating} · resilience ${res.report.resilience_score}/100 · ${res.report.verdicts.length} verdicts`
      );
      addLog("ok", t.analysisLogReady);
      setPhase("done");

      setTimeout(() => {
        router.push("/report");
      }, 1100);
    });
  }

  const isAr = lang === "ar";

  return (
    <>
      <TopNav phase="analysis" lang={lang} setLang={setLang} t={t} />
      <main
        dir={isAr ? "rtl" : "ltr"}
        lang={lang}
        className="mx-auto max-w-[1100px] px-10 py-11 pb-20"
      >
        <div className="mb-8">
          <div className="font-mono text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-brand)]">
            {t.phaseAnalysis} · 03 / 04
          </div>
          <h1 className="font-display mt-3 text-[44px] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--color-ink-1)]">
            {t.analysisTitle}
          </h1>
          <p className="mt-3 max-w-[640px] text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
            {t.analysisSubtitle}
          </p>
        </div>

        {phase === "missing" ? (
          <MissingState t={t} isAr={isAr} />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[auto_1fr]">
            <Meter progress={Math.min(100, Math.round(progress))} done={phase === "done"} />
            <div className="flex flex-col gap-6">
              <Steps active={step} done={phase === "done"} t={t} />
              <LogStream logs={logs} />
              {phase === "error" && errorDetail && (
                <div className="rounded-md border border-[var(--color-inadequate-border)] bg-[var(--color-inadequate-bg)] px-4 py-3 text-[13px] text-[var(--color-inadequate-text)]">
                  {errorDetail}
                </div>
              )}
              {phase === "done" && (
                <Link
                  href="/report"
                  className="inline-flex min-h-12 self-start items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-[15px] font-medium text-white hover:bg-[var(--color-brand-dark)]"
                >
                  {t.analysisGoToReport} <span aria-hidden>{isAr ? "←" : "→"}</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function MissingState({ t, isAr }: { t: Messages; isAr: boolean }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-5 text-center">
      <p className="max-w-[480px] text-[16px] leading-[1.6] text-[var(--color-ink-2)]">
        {t.reportPlaceholderEvidence}
      </p>
      <Link
        href="/evidence"
        className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-[15px] font-medium text-white hover:bg-[var(--color-brand-dark)]"
      >
        {t.reportGoToPlaces} <span aria-hidden>{isAr ? "←" : "→"}</span>
      </Link>
    </div>
  );
}

function Meter({ progress, done }: { progress: number; done: boolean }) {
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-border-soft)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? "var(--color-confirmed)" : "var(--color-brand)"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .25s linear, stroke .35s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-display font-semibold leading-none tracking-[-0.025em] text-[var(--color-ink-1)]"
          style={{ fontSize: 56 }}
        >
          {progress}%
        </span>
        <span className="font-mono mt-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--color-ink-3)]">
          {done ? "done" : "analyzing"}
        </span>
      </div>
    </div>
  );
}

function Steps({
  active,
  done,
  t,
}: {
  active: number;
  done: boolean;
  t: Messages;
}) {
  const steps = [t.analysisStep1, t.analysisStep2, t.analysisStep3, t.analysisStep4];
  return (
    <div className="flex flex-col gap-2">
      {steps.map((label, i) => {
        const state = done || i < active ? "done" : i === active ? "active" : "pending";
        const bg =
          state === "done"
            ? "var(--color-confirmed-bg)"
            : state === "active"
            ? "var(--color-brand-pale)"
            : "var(--color-surface)";
        const fg =
          state === "done"
            ? "var(--color-confirmed-text)"
            : state === "active"
            ? "var(--color-brand-dark)"
            : "var(--color-ink-3)";
        const dot =
          state === "done"
            ? "var(--color-confirmed)"
            : state === "active"
            ? "var(--color-brand)"
            : "var(--color-border-soft)";
        return (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-[10px] px-4 py-3 text-[14px]"
            style={{ background: bg, color: fg, fontWeight: state === "active" ? 500 : 400 }}
          >
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: dot, color: state === "pending" ? "var(--color-ink-3)" : "#fff" }}
            >
              {state === "done" ? "✓" : state === "active" ? "→" : i + 1}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}

type LogEntry = { ts: number; level: "info" | "ok" | "err"; text: string };

function LogStream({ logs }: { logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);
  return (
    <div
      ref={ref}
      className="font-mono max-h-[220px] overflow-y-auto rounded-[10px] px-5 py-4 text-[12px] leading-[1.7]"
      style={{ background: "var(--color-ink-1)", color: "rgba(255,255,255,0.85)" }}
    >
      {logs.length === 0 && (
        <span style={{ color: "rgba(255,255,255,0.4)" }}>· starting analysis</span>
      )}
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3" dir="ltr">
          <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
            {log.ts.toFixed(2).padStart(5, "0")}s
          </span>
          <span
            style={{
              color:
                log.level === "ok"
                  ? "#9FE1CB"
                  : log.level === "err"
                  ? "#F7C1C1"
                  : "rgba(255,255,255,0.7)",
            }}
          >
            {log.level === "ok" ? "✓" : log.level === "err" ? "✗" : "·"}
          </span>
          <span>{log.text}</span>
        </div>
      ))}
    </div>
  );
}
