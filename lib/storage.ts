"use client";

import { ProfileSchema, type Profile } from "./schema";
import { EvidenceSchema, type Evidence } from "./evidenceSchema";
import { ReportSchema, type Report } from "./reportSchema";

const PROFILE_KEY = "accesslens.profile.v1";
const EVIDENCE_KEY = "accesslens.evidence.v1";
const REPORT_KEY = "accesslens.report.v1";

export type StoredEvidence = {
  fileName: string;
  evidence: Evidence;
};

function safeGet(key: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or serialization error — swallow; demo flow should still work in memory
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadProfile(): Profile | null {
  const raw = safeGet(PROFILE_KEY);
  if (!raw) return null;
  const parsed = ProfileSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function saveProfile(profile: Profile): void {
  safeSet(PROFILE_KEY, profile);
}

export function clearProfile(): void {
  safeRemove(PROFILE_KEY);
}

export function loadEvidence(): StoredEvidence[] {
  const raw = safeGet(EVIDENCE_KEY);
  if (!Array.isArray(raw)) return [];
  const out: StoredEvidence[] = [];
  for (const item of raw) {
    if (
      typeof item === "object" &&
      item !== null &&
      "fileName" in item &&
      "evidence" in item &&
      typeof (item as { fileName: unknown }).fileName === "string"
    ) {
      const parsed = EvidenceSchema.safeParse((item as { evidence: unknown }).evidence);
      if (parsed.success) {
        out.push({
          fileName: (item as { fileName: string }).fileName,
          evidence: parsed.data,
        });
      }
    }
  }
  return out;
}

export function saveEvidence(items: StoredEvidence[]): void {
  safeSet(EVIDENCE_KEY, items);
}

export function clearEvidence(): void {
  safeRemove(EVIDENCE_KEY);
}

export function loadReport(): Report | null {
  const raw = safeGet(REPORT_KEY);
  if (!raw) return null;
  const parsed = ReportSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function saveReport(report: Report): void {
  safeSet(REPORT_KEY, report);
}

export function clearReport(): void {
  safeRemove(REPORT_KEY);
}

export function clearAll(): void {
  clearProfile();
  clearEvidence();
  clearReport();
}
