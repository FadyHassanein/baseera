"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { extractEvidenceFromForm, type PhotoEvidenceResult } from "../actions";
import { messages } from "@/lib/messages";
import { useLang } from "@/lib/use-lang";
import { DropZone, PhotoResultView } from "@/components/evidence-result";
import { TopNav } from "@/components/chrome";
import { saveEvidence, clearEvidence, clearReport, type StoredEvidence } from "@/lib/storage";
import { downscaleImage } from "@/lib/downscale";

const MAX_PHOTOS = 10;

export default function EvidencePage() {
  const [lang, setLang] = useLang();
  const t = messages[lang];
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<PhotoEvidenceResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrls = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previewUrls]);

  function handleFiles(incoming: FileList | File[] | null) {
    if (!incoming) return;
    const array = Array.from(incoming);
    const images = array.filter((f) => f.type.startsWith("image/"));
    const rejected = array.length - images.length;

    if (rejected > 0) {
      setWarning(t.evidenceNotAnImage);
    } else {
      setWarning(null);
    }

    setFiles((prev) => {
      const combined = [...prev, ...images];
      if (combined.length > MAX_PHOTOS) {
        setWarning(t.evidenceTooManyPhotos);
        return combined.slice(0, MAX_PHOTOS);
      }
      return combined;
    });

    setResults([]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResults([]);
    setWarning(null);
  }

  function clearAll() {
    setFiles([]);
    setResults([]);
    setWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    clearEvidence();
    clearReport();
  }

  async function handleAnalyze() {
    if (files.length === 0 || analyzing) return;
    setAnalyzing(true);
    setWarning(null);

    const downscaled = await Promise.all(files.map(downscaleImage));
    const formData = new FormData();
    formData.append("lang", lang);
    downscaled.forEach((file) => formData.append("photos", file));

    try {
      const photoResults = await extractEvidenceFromForm(formData);
      setResults(photoResults);
      const stored: StoredEvidence[] = photoResults
        .filter((r): r is typeof r & { evidence: NonNullable<typeof r.evidence> } => r.evidence !== null)
        .map((r) => ({ fileName: r.fileName, evidence: r.evidence }));
      if (stored.length > 0) saveEvidence(stored);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
    <TopNav phase="places" lang={lang} setLang={setLang} t={t} />
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className="mx-auto max-w-5xl px-6 py-10"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-brand)]">
            {t.phasePlaces} · 02 / 04
          </div>
          <h1 className="font-display mt-3 text-[44px] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--color-ink-1)]">
            {t.evidenceTitle}
          </h1>
          <p className="mt-3 max-w-[640px] text-[16px] text-[var(--color-ink-2)]">{t.evidenceSubtitle}</p>
        </div>
        <a
          href="/profile"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--color-border-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-brand-pale)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
        >
          <span aria-hidden>{lang === "ar" ? "→" : "←"}</span>
          {t.backToProfile}
        </a>
      </div>

      <DropZone
        onFiles={handleFiles}
        onClick={() => fileInputRef.current?.click()}
        title={t.evidenceUploadHint}
        subtitle={t.evidenceUploadSubtitle}
        buttonLabel={t.evidenceChooseFiles}
        disabled={analyzing}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {warning && (
        <div className="mt-4 rounded-lg border border-[var(--color-decision)] bg-[var(--color-decision-bg)] px-3 py-2 text-xs text-[var(--color-decision-text)]">
          {warning}
        </div>
      )}

      {previewUrls.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {previewUrls.map((p, idx) => (
              <div key={p.url} className="relative group">
                <img
                  src={p.url}
                  alt={p.file.name}
                  className="aspect-square w-full rounded-lg object-cover border border-[var(--color-border-soft)]"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  disabled={analyzing}
                  aria-label={`Remove ${p.file.name}`}
                  className="absolute top-1 end-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink-1)]/70 text-white text-xs hover:bg-[var(--color-ink-1)] disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || files.length === 0}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--color-brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? t.evidenceAnalyzing : t.evidenceAnalyze}
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={analyzing}
              className="text-sm text-[var(--color-ink-2)] underline-offset-2 hover:underline hover:text-[var(--color-brand)] disabled:opacity-50"
            >
              {t.evidenceClearPhotos}
            </button>
            {results.some((r) => r.evidence !== null) && (
              <a
                href="/analysis"
                className="ms-auto inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--color-brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
              >
                {t.continueToReport}
                <span aria-hidden>{lang === "ar" ? "←" : "→"}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <section className="mt-10 space-y-8">
          {results.map((result, idx) => {
            const preview = previewUrls[idx];
            return (
              <PhotoResultView
                key={result.fileName + idx}
                result={result}
                previewUrl={preview?.url}
                t={t}
                lang={lang}
              />
            );
          })}
        </section>
      )}
    </main>
    </>
  );
}

