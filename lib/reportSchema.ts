import { z } from "zod";
import { DimensionEnum } from "./evidenceSchema";

const Pct = z.number().int().min(0).max(100);

export const ReportStateEnum = z.enum([
  "confirmed",
  "uncertain",
  "unknown",
  "inadequate",
]);
export type ReportState = z.infer<typeof ReportStateEnum>;

export const SourceRefSchema = z.object({
  kind: z.enum(["photo", "narrative", "inferred"]),
  index: z.number().int().min(1).nullable(),
  note: z.string().nullable(),
});

export const VerdictSchema = z.object({
  dimension: DimensionEnum,
  state: ReportStateEnum,
  confidence: Pct,
  headline: z.string().min(1),
  body: z.string().min(1),
  source_refs: z.array(SourceRefSchema),
  next_question: z.string().nullable(),
});

export type Verdict = z.infer<typeof VerdictSchema>;

export const RiskSchema = z.object({
  dimension: DimensionEnum,
  body: z.string().min(1),
  action: z.string().min(1),
});

export type Risk = z.infer<typeof RiskSchema>;

export const DraftMessageSchema = z.object({
  subject: z.string().nullable(),
  body: z.string().min(1),
  target: z.string(),
});

export type DraftMessage = z.infer<typeof DraftMessageSchema>;

export const ReportSchema = z.object({
  language: z.enum(["ar", "en"]),
  place_name: z.string().nullable(),
  resilience_score: z.number().int().min(0).max(100),
  rating: z.string().min(1),
  summary: z.string().min(1),
  counts: z.object({
    confirmed: z.number().int().min(0),
    uncertain: z.number().int().min(0),
    unknown: z.number().int().min(0),
    inadequate: z.number().int().min(0),
  }),
  verdicts: z.array(VerdictSchema),
  risks: z.array(RiskSchema),
  draft_message: DraftMessageSchema.nullable(),
});

export type Report = z.infer<typeof ReportSchema>;
