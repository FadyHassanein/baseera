import Anthropic from "@anthropic-ai/sdk";
import {
  ProfileSchema,
  ProfilerTurnSchema,
  type Profile,
  type ProfilerTurn,
  type ConversationMessage,
} from "./schema";
import { SYSTEM_PROMPT } from "./prompts";
import { ReportSchema, type Report } from "./reportSchema";
import { REPORT_SYSTEM_PROMPT } from "./reportPrompt";
import type { Evidence } from "./evidenceSchema";

export const MODEL_ID = "claude-sonnet-4-6";

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export type ProfileResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string; raw?: string };

export type TurnResult =
  | { ok: true; turn: ProfilerTurn }
  | { ok: false; error: string; raw?: string };

export async function runProfilerTurn(
  messages: ConversationMessage[]
): Promise<TurnResult> {
  if (messages.length === 0) {
    return { ok: false, error: "Conversation is empty." };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY is not set." };
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
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

  const result = ProfilerTurnSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: "Schema validation failed: " + JSON.stringify(result.error.format()),
      raw: cleaned,
    };
  }

  return { ok: true, turn: result.data };
}

export async function generateProfile(narrative: string): Promise<ProfileResult> {
  if (!narrative.trim()) {
    return { ok: false, error: "Empty narrative." };
  }

  const result = await runProfilerTurn([{ role: "user", content: narrative }]);
  if (!result.ok) {
    return { ok: false, error: result.error, raw: result.raw };
  }

  if (result.turn.type === "profile") {
    return { ok: true, profile: result.turn.profile };
  }

  return {
    ok: false,
    error:
      "Model asked a follow-up question instead of producing a profile. Use the conversational profiler instead. Question was: " +
      result.turn.text,
  };
}

export type ReportResult =
  | { ok: true; report: Report }
  | { ok: false; error: string; raw?: string };

export async function runReport(
  profile: Profile,
  evidence: Evidence[],
  placeName?: string
): Promise<ReportResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY is not set." };
  }

  const client = new Anthropic();

  const userPayload = {
    profile,
    evidence,
    place_name: placeName ?? null,
  };

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: REPORT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: JSON.stringify(userPayload, null, 2),
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

  const result = ReportSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: "Schema validation failed: " + JSON.stringify(result.error.format()),
      raw: cleaned,
    };
  }

  return { ok: true, report: result.data };
}

export { ProfileSchema };
