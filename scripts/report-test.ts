import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { generateProfile, runReport } from "../lib/anthropic";
import { EvidenceSchema, type Evidence } from "../lib/evidenceSchema";

const PHOTO_FIXTURES = [
  "wheelchair-ramp.json",
  "stairs-grand.json",
  "accessible-toilet.json",
];

function header(s: string) {
  return "\n" + "─".repeat(8) + " " + s + " " + "─".repeat(Math.max(0, 60 - s.length)) + "\n";
}

function loadEvidenceFixture(name: string): Evidence {
  const p = path.resolve("fixtures/evidence", name);
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  return EvidenceSchema.parse(raw);
}

async function main() {
  console.log(header("Step 1 — Generate profile from English fixture"));
  const transcript = fs.readFileSync("fixtures/transcript-english.txt", "utf8").trim();
  const profileResult = await generateProfile(transcript);
  if (!profileResult.ok) {
    console.error("Profile generation failed:", profileResult.error);
    process.exit(1);
  }
  console.log("✓ profile generated (language=" + profileResult.profile.language + ")");
  console.log("  mobility.specifics:", JSON.stringify(profileResult.profile.mobility.specifics));
  console.log("  bathroom.requirements:", JSON.stringify(profileResult.profile.bathroom.requirements));
  console.log("  equipment.items:", JSON.stringify(profileResult.profile.equipment.items));

  console.log(header("Step 2 — Load 3 evidence fixtures"));
  const evidence = PHOTO_FIXTURES.map((name) => {
    const ev = loadEvidenceFixture(name);
    console.log(`  ✓ ${name} — ${ev.findings.length} findings`);
    return ev;
  });

  console.log(header("Step 3 — Generate matched report"));
  const reportResult = await runReport(profileResult.profile, evidence, "Test venue");
  if (!reportResult.ok) {
    console.error("Report generation failed:", reportResult.error);
    if (reportResult.raw) {
      console.error("\nRaw output:\n" + reportResult.raw);
    }
    process.exit(1);
  }

  const r = reportResult.report;
  console.log(`✓ report generated (language=${r.language})`);
  console.log(`\nResilience: ${r.resilience_score} / 100  ·  ${r.rating}`);
  console.log(`Counts: ${r.counts.confirmed} confirmed, ${r.counts.uncertain} uncertain, ${r.counts.unknown} unknown, ${r.counts.inadequate} inadequate`);
  console.log(`\nSummary: ${r.summary}`);

  console.log("\nVerdicts:");
  for (const v of r.verdicts) {
    const stateIcon =
      v.state === "confirmed" ? "✓" :
      v.state === "uncertain" ? "~" :
      v.state === "unknown"   ? "?" : "✗";
    console.log(`  ${stateIcon} [${v.dimension}] ${v.headline} (${v.state} · ${v.confidence}%)`);
    console.log(`     ${v.body.slice(0, 120)}${v.body.length > 120 ? "…" : ""}`);
    if (v.next_question) {
      console.log(`     → ask: ${v.next_question}`);
    }
  }

  console.log("\nRisks:");
  for (const risk of r.risks) {
    console.log(`  ! [${risk.dimension}] ${risk.body}`);
    console.log(`     → ${risk.action}`);
  }

  if (r.draft_message) {
    console.log("\nDraft message:");
    if (r.draft_message.subject) console.log(`  Subject: ${r.draft_message.subject}`);
    console.log(`  To: ${r.draft_message.target}`);
    console.log(`  Body: ${r.draft_message.body}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
