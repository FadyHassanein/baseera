import "dotenv/config";
import { runProfilerTurn } from "../lib/anthropic";
import type { ConversationMessage } from "../lib/schema";

type ScriptedUserTurn = string;

type Scenario = {
  name: string;
  expectFirst: "question" | "profile";
  userTurns: ScriptedUserTurn[];
};

const scenarios: Scenario[] = [
  {
    name: "detailed-arabic — expect profile on turn 1",
    expectFirst: "profile",
    userTurns: [
      `قبل سنتين صار لي جلطة في المخ. من بعدها صار جانبي اليسار أضعف من اليمين بكثير، وما أقدر أمشي مسافة طويلة بدون ما أرتاح. الدرج صعب علي مرة، ولازم أجلس وقت الاستحمام لأني ما أقدر أوقف فترة طويلة. أستخدم عصاية أحياناً. سمعي وبصري الحمد لله طبيعيين.`,
    ],
  },
  {
    name: "vague-english — expect question first, then follow-up",
    expectFirst: "question",
    userTurns: [
      "I have weak knees and can't walk far.",
      "I use a cane sometimes. Stairs are really hard. No vision or hearing issues. I can shower standing if there's something to hold on to.",
    ],
  },
];

function header(s: string) {
  return "\n" + "─".repeat(8) + " " + s + " " + "─".repeat(Math.max(0, 60 - s.length)) + "\n";
}

async function run() {
  for (const scenario of scenarios) {
    console.log(header(scenario.name));
    const messages: ConversationMessage[] = [];

    for (let i = 0; i < scenario.userTurns.length; i++) {
      const userTurn = scenario.userTurns[i];
      messages.push({ role: "user", content: userTurn });

      console.log(`\nUSER ${i + 1}: ${userTurn.slice(0, 80)}${userTurn.length > 80 ? "…" : ""}`);

      const result = await runProfilerTurn(messages);

      if (!result.ok) {
        console.log("FAILED:", result.error);
        if (result.raw) console.log("RAW:", result.raw);
        break;
      }

      if (result.turn.type === "question") {
        console.log(`AI    : (question) ${result.turn.text}`);
        messages.push({ role: "assistant", content: JSON.stringify(result.turn) });

        if (i === 0 && scenario.expectFirst !== "question") {
          console.log(`  ⚠ Expected '${scenario.expectFirst}' on turn 1 but got 'question'.`);
        }
      } else {
        console.log(`AI    : (profile) language=${result.turn.profile.language}`);
        console.log(`  narrative: ${result.turn.profile.narrative_summary}`);
        console.log(`  mobility.specifics: ${JSON.stringify(result.turn.profile.mobility.specifics)} (conf ${result.turn.profile.mobility.confidence})`);
        console.log(`  bathroom.requirements: ${JSON.stringify(result.turn.profile.bathroom.requirements)} (conf ${result.turn.profile.bathroom.confidence})`);
        console.log(`  equipment.items: ${JSON.stringify(result.turn.profile.equipment.items)} (conf ${result.turn.profile.equipment.confidence})`);

        if (i === 0 && scenario.expectFirst !== "profile") {
          console.log(`  ⚠ Expected '${scenario.expectFirst}' on turn 1 but got 'profile'.`);
        }

        break;
      }
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
