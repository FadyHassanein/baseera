"use client";

import { useState } from "react";
import type { Lang, Messages } from "@/lib/messages";
import type { Finding } from "@/lib/evidenceSchema";
import type { PhotoEvidenceResult } from "@/app/actions";
import { labelFor } from "@/lib/vocabulary";
import {
  BORDER_BY_STATE,
  ConfidenceBadge,
  stateForConfidence,
  stateLabel,
} from "./confidence";

export function DropZone({
  onFiles,
  onClick,
  title,
  subtitle,
  buttonLabel,
  disabled,
}: {
  onFiles: (files: FileList) => void;
  onClick: () => void;
  title: string;
  subtitle: string;
  buttonLabel: string;
  disabled: boolean;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onFiles(e.dataTransfer.files);
        }
      }}
      className={`w-full rounded-2xl px-6 py-12 text-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 ${
        dragging
          ? "border-2 border-solid border-[var(--color-brand)] bg-[var(--color-brand-pale)]"
          : "border-2 border-dashed border-[var(--color-border-soft)] bg-[var(--color-surface)] hover:border-[var(--color-brand-light)]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-pale)] text-[var(--color-brand-dark)] text-xl"
        aria-hidden
      >
        ↑
      </div>
      <div className="text-base font-medium text-[var(--color-ink-1)]">{title}</div>
      <div className="mt-1 text-sm text-[var(--color-ink-3)]">{subtitle}</div>
      <span
        className="mt-4 inline-block rounded-md bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-white shadow-sm"
        aria-hidden
      >
        {buttonLabel}
      </span>
    </div>
  );
}

export function PhotoResultView({
  result,
  previewUrl,
  t,
  lang,
}: {
  result: PhotoEvidenceResult;
  previewUrl: string | undefined;
  t: Messages;
  lang: Lang;
}) {
  return (
    <article className="rounded-lg border border-[var(--color-border-soft)] bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt={result.fileName}
              className="w-full rounded-lg border border-[var(--color-border-soft)] object-cover max-h-96"
            />
          )}
          <p className="mt-2 text-xs text-[var(--color-ink-3)] break-all">{result.fileName}</p>
        </div>

        <div className="space-y-4">
          {result.error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <strong>{t.evidenceFailed}</strong> {result.error}
            </div>
          ) : result.evidence ? (
            <>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
                  {t.evidencePhotoDescription}
                </div>
                <p className="mt-1 text-sm text-[var(--color-ink-1)] leading-relaxed">
                  {result.evidence.photo_description}
                </p>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-3)] mb-2">
                  {t.evidenceFindings} ({result.evidence.findings.length})
                </div>
                {result.evidence.findings.length === 0 ? (
                  <p className="text-sm italic text-[var(--color-ink-3)]">{t.evidenceNoFindings}</p>
                ) : (
                  <ul className="space-y-2">
                    {result.evidence.findings.map((finding, idx) => (
                      <FindingItem key={idx} finding={finding} t={t} lang={lang} />
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function FindingItem({
  finding,
  t,
  lang,
}: {
  finding: Finding;
  t: Messages;
  lang: Lang;
}) {
  const pct = Math.round(finding.confidence * 100);
  const state = stateForConfidence(finding.confidence);

  return (
    <li
      className={`rounded-r-md border border-[var(--color-border-soft)] border-l-4 ${BORDER_BY_STATE[state]} bg-white p-4`}
    >
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <span className="text-base font-semibold text-[var(--color-ink-1)]">
          {labelFor("dimension", finding.dimension, lang)}
        </span>
        <ConfidenceBadge state={state} pct={pct} label={stateLabel(state, t)} />
      </div>
      <p className="text-base text-[var(--color-ink-2)] leading-relaxed">{finding.observation}</p>
      {finding.estimated_measure && (
        <p className="mt-2 text-xs uppercase tracking-wide text-[var(--color-ink-3)]">
          {t.evidenceMeasure}:{" "}
          <span className="normal-case font-medium text-[var(--color-ink-2)]">
            {finding.estimated_measure}
          </span>
        </p>
      )}
    </li>
  );
}
