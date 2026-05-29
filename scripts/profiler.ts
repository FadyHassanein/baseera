import "dotenv/config";
import { generateProfile } from "../lib/anthropic";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function main() {
  const narrative = await readStdin();
  if (!narrative) {
    console.error("No input received. Pipe a narrative into stdin.");
    process.exit(1);
  }

  const result = await generateProfile(narrative);
  if (!result.ok) {
    console.error(result.error);
    if (result.raw) {
      console.error("\nRaw output was:");
      console.error(result.raw);
    }
    process.exit(1);
  }

  console.log(JSON.stringify(result.profile, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
