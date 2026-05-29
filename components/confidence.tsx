import type { Messages } from "@/lib/messages";

export type ConfidenceState = "confirmed" | "uncertain" | "unknown" | "inadequate";

export function stateForConfidence(confidence: number): ConfidenceState {
  if (confidence >= 0.85) return "confirmed";
  if (confidence >= 0.6) return "uncertain";
  return "unknown";
}

export function stateLabel(state: ConfidenceState, t: Messages): string {
  if (state === "confirmed") return t.stateConfirmed;
  if (state === "uncertain") return t.stateUncertain;
  if (state === "unknown") return t.stateUnknown;
  return t.stateInadequate;
}

export const BORDER_BY_STATE: Record<ConfidenceState, string> = {
  confirmed: "border-l-[var(--color-confirmed)]",
  uncertain: "border-l-[var(--color-uncertain)]",
  unknown: "border-l-[var(--color-border-soft)]",
  inadequate: "border-l-[var(--color-inadequate)]",
};

export const BADGE_BG_BY_STATE: Record<ConfidenceState, string> = {
  confirmed: "bg-[var(--color-confirmed)]",
  uncertain: "bg-[var(--color-uncertain)]",
  unknown: "bg-[var(--color-unknown)]",
  inadequate: "bg-[var(--color-inadequate)]",
};

export function ConfidenceBadge({
  state,
  pct,
  label,
}: {
  state: ConfidenceState;
  pct: number | null;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${BADGE_BG_BY_STATE[state]} px-2.5 py-1 text-xs font-medium text-white whitespace-nowrap`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden />
      {label}
      {pct !== null && <> · {pct}%</>}
    </span>
  );
}
