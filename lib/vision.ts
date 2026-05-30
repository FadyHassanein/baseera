import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { EvidenceSchema, type Evidence } from "./evidenceSchema";
import { visionSystemPrompt } from "./visionPrompt";

const MODEL_ID = "claude-sonnet-4-6";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export type ImageSource =
  | { type: "url"; url: string }
  | { type: "base64"; data: string; mediaType: ImageMediaType };

export type EvidenceResult =
  | { ok: true; evidence: Evidence }
  | { ok: false; error: string; raw?: string };

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function extractEvidence(
  source: ImageSource,
  lang: "ar" | "en" = "en"
): Promise<EvidenceResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY is not set." };
  }

  const client = new Anthropic();

  const imageBlock =
    source.type === "url"
      ? {
          type: "image" as const,
          source: { type: "url" as const, url: source.url },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            data: source.data,
            media_type: source.mediaType,
          },
        };

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: visionSystemPrompt(lang),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [imageBlock],
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") {
    return { ok: false, error: "Unexpected response type from Claude." };
  }

  const cleaned = stripCodeFences(block.text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, error: "Claude did not return valid JSON.", raw: block.text };
  }

  const result = EvidenceSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: "Schema validation failed: " + JSON.stringify(result.error.format()),
      raw: cleaned,
    };
  }

  return { ok: true, evidence: result.data };
}

function mediaTypeForFile(filePath: string): ImageMediaType {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

export async function imageFileToSource(filePath: string): Promise<ImageSource> {
  const buffer = await readFile(filePath);
  return {
    type: "base64",
    data: buffer.toString("base64"),
    mediaType: mediaTypeForFile(filePath),
  };
}
