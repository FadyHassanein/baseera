import { z } from "zod";

const Confidence = z.number().min(0).max(1);

export const DimensionEnum = z.enum([
  "entrance",
  "bathroom",
  "seating",
  "lighting",
  "flooring",
  "path_width",
  "parking",
  "signage",
  "equipment",
  "doorway",
  "counter_height",
  "other",
]);

export type Dimension = z.infer<typeof DimensionEnum>;

export const FindingSchema = z.object({
  dimension: DimensionEnum,
  observation: z.string().min(1),
  estimated_measure: z.string().nullable(),
  confidence: Confidence,
});

export type Finding = z.infer<typeof FindingSchema>;

export const EvidenceSchema = z.object({
  language: z.enum(["ar", "en"]),
  photo_description: z.string().min(1),
  findings: z.array(FindingSchema),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
