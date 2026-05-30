import OpenAI from "openai";
import type { Lang } from "./messages";

export type TranscribeResult =
  | { ok: true; transcript: string }
  | { ok: false; error: string };

export async function transcribeAudio(audio: Blob, lang?: Lang): Promise<TranscribeResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY is not set. Add it to .env" };
  }

  const openai = new OpenAI();
  const file = new File([audio], "recording.webm", {
    type: audio.type || "audio/webm",
  });

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: lang,
  });

  const text = response.text.trim();
  if (!text) {
    return { ok: false, error: "No speech detected." };
  }

  return { ok: true, transcript: text };
}
