"use server";

import { runProfilerTurn, runReport } from "@/lib/anthropic";
import { transcribeAudio as whisperTranscribe } from "@/lib/whisper";
import { extractEvidence, type ImageMediaType } from "@/lib/vision";
import type { Profile, ProfilerTurn, ConversationMessage } from "@/lib/schema";
import type { Evidence } from "@/lib/evidenceSchema";
import type { Report } from "@/lib/reportSchema";
import type { Lang } from "@/lib/messages";

export type ProfilerTurnResponse =
  | { ok: true; turn: ProfilerTurn }
  | { ok: false; error: string };

const MAX_USER_TURNS = 3;

export async function submitProfilerTurn(
  messages: ConversationMessage[]
): Promise<ProfilerTurnResponse> {
  if (messages.length === 0) {
    return { ok: false, error: "Conversation is empty." };
  }

  const userTurnCount = messages.filter((m) => m.role === "user").length;
  if (userTurnCount > MAX_USER_TURNS) {
    return {
      ok: false,
      error: `Conversation exceeded ${MAX_USER_TURNS} user turns. Start over.`,
    };
  }

  const result = await runProfilerTurn(messages);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, turn: result.turn };
}

export type TranscribeResponse =
  | { transcript: string; error: null }
  | { transcript: null; error: string };

export type PhotoEvidenceResult = {
  fileName: string;
  evidence: Evidence | null;
  error: string | null;
};

const MAX_PHOTOS = 10;
// Cap simultaneous vision calls — firing 10 at once occasionally times out on
// weaker networks. 5-wide keeps the batch fast while staying reliable.
const PHOTO_CONCURRENCY = 5;
const TRANSIENT_ERROR = /ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|fetch failed|Connection error|terminated/i;

function mediaTypeFromName(name: string): ImageMediaType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  return TRANSIENT_ERROR.test(msg);
}

async function extractOne(file: File, lang: Lang): Promise<PhotoEvidenceResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const source = {
    type: "base64" as const,
    data: buffer.toString("base64"),
    mediaType: mediaTypeFromName(file.name),
  };

  // One retry on a transient network error (the rest of the batch is unaffected).
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await extractEvidence(source, lang);
      if (!result.ok) {
        return { fileName: file.name, evidence: null, error: result.error };
      }
      return { fileName: file.name, evidence: result.evidence, error: null };
    } catch (err) {
      if (attempt === 0 && isTransient(err)) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      return {
        fileName: file.name,
        evidence: null,
        error: err instanceof Error ? err.message : "Unknown error processing this photo.",
      };
    }
  }
  return { fileName: file.name, evidence: null, error: "Unknown error processing this photo." };
}

// Bounded-concurrency map that preserves input order.
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function extractEvidenceFromForm(
  formData: FormData
): Promise<PhotoEvidenceResult[]> {
  const lang = (formData.get("lang") as Lang | null) ?? "en";
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_PHOTOS);

  if (files.length === 0) {
    return [];
  }

  return mapPool(files, PHOTO_CONCURRENCY, (file) => extractOne(file, lang));
}

export async function transcribeAudio(formData: FormData): Promise<TranscribeResponse> {
  const audio = formData.get("audio");
  const lang = (formData.get("lang") as Lang | null) ?? undefined;

  if (!(audio instanceof Blob)) {
    return { transcript: null, error: "No audio received." };
  }

  if (audio.size === 0) {
    return { transcript: null, error: "Empty audio recording." };
  }

  try {
    const result = await whisperTranscribe(audio, lang);
    if (!result.ok) {
      return { transcript: null, error: result.error };
    }
    return { transcript: result.transcript, error: null };
  } catch (err) {
    return {
      transcript: null,
      error: err instanceof Error ? err.message : "Transcription failed.",
    };
  }
}

export type GenerateReportResponse =
  | { ok: true; report: Report }
  | { ok: false; error: string };

export async function generateReport(
  profile: Profile,
  evidence: Evidence[],
  placeName: string | null
): Promise<GenerateReportResponse> {
  if (evidence.length === 0) {
    return { ok: false, error: "No evidence supplied." };
  }
  const result = await runReport(profile, evidence, placeName ?? undefined);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, report: result.report };
}
