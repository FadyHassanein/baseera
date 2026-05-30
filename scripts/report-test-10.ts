import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { extractEvidence, imageFileToSource } from "../lib/vision";
import { generateProfile, runReport } from "../lib/anthropic";
import type { Evidence } from "../lib/evidenceSchema";

// 10 photos — the new maximum. Mirrors the server's parallel extraction.
const PHOTOS = [
  "wheelchair-ramp.jpg",
  "stairs-grand.jpg",
  "accessible-toilet.jpg",
  "automatic-door-station.jpg",
  "revolving-door.jpg",
  "elevator-historic.jpg",
  "mosque-interior.jpg",
  "tactile-paving.jpg",
  "cafe-interior.jpg",
  "urban-street-universal-design.jpg",
];

function header(s: string) {
  return "\n" + "─".repeat(8) + " " + s + " " + "─".repeat(Math.max(0, 56 - s.length)) + "\n";
}

async function main() {
  console.log(header("Step 1 — Arabic profile (worst case for report tokens)"));
  const transcript = fs.readFileSync("fixtures/transcript-arabic.txt", "utf8").trim();
  const profileResult = await generateProfile(transcript);
  if (!profileResult.ok) {
    console.error("Profile generation failed:", profileResult.error);
    process.exit(1);
  }
  console.log("✓ profile language =", profileResult.profile.language);

  console.log(header(`Step 2 — Extract evidence from ${PHOTOS.length} photos in parallel`));
  const t0 = process.hrtime.bigint();
  const results = await Promise.all(
    PHOTOS.map(async (name) => {
      const source = await imageFileToSource(path.resolve("fixtures/photos", name));
      const res = await extractEvidence(source);
      return { name, res };
    })
  );
  const elapsedMs = Number(process.hrtime.bigint() - t0) / 1e6;

  const evidence: Evidence[] = [];
  let failed = 0;
  let totalFindings = 0;
  for (const { name, res } of results) {
    if (res.ok) {
      evidence.push(res.evidence);
      totalFindings += res.evidence.findings.length;
      console.log(`  ✓ ${name.padEnd(34)} ${res.evidence.findings.length} findings`);
    } else {
      failed++;
      console.log(`  ✗ ${name.padEnd(34)} ERROR: ${res.error}`);
    }
  }
  console.log(
    `\n  ${evidence.length}/${PHOTOS.length} succeeded · ${totalFindings} total findings · ${(elapsedMs / 1000).toFixed(1)}s wall`
  );
  if (failed > 0) {
    console.log(`  ⚠ ${failed} extraction(s) failed (rate limit?) — report runs on the rest.`);
  }

  console.log(header(`Step 3 — Report over ${evidence.length} photos' evidence`));
  const reportResult = await runReport(profileResult.profile, evidence, "مقهى الرياض");
  if (!reportResult.ok) {
    console.error("✗ Report FAILED:", reportResult.error);
    if (reportResult.raw) {
      console.error(`\n  raw length: ${reportResult.raw.length} chars`);
      console.error("  raw tail: …" + reportResult.raw.slice(-200));
    }
    process.exit(1);
  }

  const r = reportResult.report;
  console.log(`✓ report parsed cleanly (language=${r.language})`);
  console.log(`\nResilience: ${r.resilience_score} / 100  ·  ${r.rating}`);
  console.log(
    `Counts: ${r.counts.confirmed} confirmed, ${r.counts.uncertain} uncertain, ${r.counts.unknown} unknown, ${r.counts.inadequate} inadequate`
  );
  console.log(`Verdicts: ${r.verdicts.length}  ·  Risks: ${r.risks.length}  ·  Draft message: ${r.draft_message ? "yes" : "none"}`);
  console.log(`\nSummary: ${r.summary}`);
  console.log("\nVerdict headlines:");
  for (const v of r.verdicts) {
    const icon = v.state === "confirmed" ? "✓" : v.state === "uncertain" ? "~" : v.state === "unknown" ? "?" : "✗";
    console.log(`  ${icon} [${v.dimension}] ${v.headline} (${v.state} · ${v.confidence}%)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
