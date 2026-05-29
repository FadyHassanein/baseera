import { z } from "zod";

const Confidence = z.number().min(0).max(1);

export const ProfileSchema = z.object({
  language: z.enum(["ar", "en"]),
  narrative_summary: z.string().min(1),

  mobility: z.object({
    level: z.enum(["full", "partial", "very_limited", "none"]),
    specifics: z.array(z.string()),
    confidence: Confidence,
  }),

  bathroom: z.object({
    requirements: z.array(z.string()),
    confidence: Confidence,
  }),

  stamina: z.object({
    walking_distance_tolerance: z.enum(["long", "moderate", "short", "very_short"]),
    rest_needed: z.boolean(),
    confidence: Confidence,
  }),

  sensory: z.object({
    vision: z.enum(["normal", "low", "blind"]),
    hearing: z.enum(["normal", "low", "deaf"]),
    confidence: Confidence,
  }),

  cognitive: z.object({
    wayfinding_support_needed: z.boolean(),
    sensory_overload_concern: z.boolean(),
    confidence: Confidence,
  }),

  equipment: z.object({
    items: z.array(z.string()),
    confidence: Confidence,
  }),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const ProfilerTurnSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("question"),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("profile"),
    profile: ProfileSchema,
  }),
]);

export type ProfilerTurn = z.infer<typeof ProfilerTurnSchema>;

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};
