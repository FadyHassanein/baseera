import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { extractEvidence, imageFileToSource, type ImageSource } from "../lib/vision";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: tsx scripts/evidence.ts <image-path-or-url>");
    console.error("");
    console.error("Examples:");
    console.error("  tsx scripts/evidence.ts fixtures/photos/entrance.jpg");
    console.error("  tsx scripts/evidence.ts https://example.com/photo.jpg");
    process.exit(1);
  }

  let source: ImageSource;

  if (arg.startsWith("http://") || arg.startsWith("https://")) {
    source = { type: "url", url: arg };
  } else {
    const resolved = path.resolve(arg);
    if (!fs.existsSync(resolved)) {
      console.error(`File not found: ${resolved}`);
      process.exit(1);
    }
    source = await imageFileToSource(resolved);
  }

  const result = await extractEvidence(source);

  if (!result.ok) {
    console.error(result.error);
    if (result.raw) {
      console.error("\nRaw output:");
      console.error(result.raw);
    }
    process.exit(1);
  }

  console.log(JSON.stringify(result.evidence, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
