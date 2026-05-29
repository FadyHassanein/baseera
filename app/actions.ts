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

const MAX_PHOTOS = 6;

function mediaTypeFromName(name: string): ImageMediaType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function extractEvidenceFromForm(
  formData: FormData
): Promise<PhotoEvidenceResult[]> {
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_PHOTOS);

  if (files.length === 0) {
    return [];
  }

  const tasks = files.map(async (file): Promise<PhotoEvidenceResult> => {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await extractEvidence({
        type: "base64",
        data: buffer.toString("base64"),
        mediaType: mediaTypeFromName(file.name),
      });

      if (!result.ok) {
        return { fileName: file.name, evidence: null, error: result.error };
      }
      return { fileName: file.name, evidence: result.evidence, error: null };
    } catch (err) {
      return {
        fileName: file.name,
        evidence: null,
        error: err instanceof Error ? err.message : "Unknown error processing this photo.",
      };
    }
  });

  return await Promise.all(tasks);
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
