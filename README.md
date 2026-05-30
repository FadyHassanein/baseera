# بصيرة · Baseera

**Bilingual AI accessibility intelligence for any place.**

🟢 **Live demo:** <https://baseera.up.railway.app/>

Baseera reads photos and descriptions of any place — homes, restaurants, clinics, public spaces — and produces an honest, confidence-scored accessibility report for a specific visitor, in Arabic or English.

This is the submission for the [**King Salman Center for Disability Research AI Hackathon for Persons with Disabilities**](https://hackathon.kscdr.org/) (Riyadh, October 11–13 2026), in the **Daily Life & Assistive Technologies** track.

---

## What makes it different

- **Personalized to the visitor.** A 5 cm threshold is impassable for one wheelchair user, trivial for another. Baseera matches what each person needs against what each place actually offers — never a binary "accessible / not."
- **Reads pixels, not tags.** Vision models read venue photos directly. Threshold heights, grab-bar placement, transfer space, lighting — estimated from the image, not from a checkbox.
- **Honest about uncertainty.** Four explicit confidence states — *Confirmed · Uncertain · Unknown · Likely inadequate* — never just a star rating. A confident wrong answer is worse than no answer.
- **Bilingual.** Arabic and English, with RTL layout and Cairo typography for Arabic. The model handles Saudi/Egyptian dialect input directly.
- **Never asks for a diagnosis.** Asks about *experience*, not condition. The needs profile is functional, not medical.

---

## Demo flow

Four phases mapped to four routes:

| Phase | Route | What happens |
|---|---|---|
| 01 · Needs profile | `/profile` | A short conversational chat (max 2 follow-ups). Voice input via Whisper. Outputs a structured functional-needs profile — never a diagnosis. |
| 02 · Add a place | `/evidence` | Drag-and-drop 1–6 photos of any venue. Each photo is analyzed by Claude vision against ten accessibility dimensions: entrance, bathroom, seating, lighting, flooring, path width, parking, signage, equipment, doorways, counter height. |
| 03 · Analysis | *planned* | Live progress meter + per-place lanes. Currently transient inside Phase 02. |
| 04 · Journey report | *planned* | Resilience score over dark hero, per-place verdicts, auto-drafted messages to ask the venue for missing details. |

---

## Run locally

**Prerequisites**

- [Node.js 20+](https://nodejs.org)
- An [Anthropic API key](https://console.anthropic.com) (Claude Sonnet 4.6 — required, used for chat + vision)
- An [OpenAI API key](https://platform.openai.com) (Whisper — optional, only needed for voice input)

**Setup**

```bash
git clone https://github.com/FadyHassanein/baseera.git
cd baseera
npm install
cp .env.example .env
# Edit .env and paste your keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   OPENAI_API_KEY=sk-...           (optional)
npm run dev
```

Visit <http://localhost:3000>.

**Other useful scripts**

| Command | What |
|---|---|
| `npm run profile:ar` | Single-shot CLI test on the Arabic stroke-survivor fixture |
| `npm run profile:en` | Single-shot CLI test on the English wheelchair-user fixture |
| `npm run profile:chat` | Multi-turn conversational profiler smoke test |
| `npm run evidence -- "fixtures/photos/wheelchair-ramp.jpg"` | Vision pipeline on a single image (local path or URL) |
| `npm run build` | Production build |

---

## Project structure

```
app/                  Next.js 15 App Router
  page.tsx              Landing (editorial hero + how-it-works + honesty manifesto + FAQ)
  profile/page.tsx      Phase 01 — chat profiler with voice
  evidence/page.tsx     Phase 02 — place upload
  actions.ts            Server actions (Anthropic, Whisper, vision)
  globals.css           Theme tokens (palette + typography)
  layout.tsx            Root, font loading

components/           Shared React
  chrome.tsx            BrandMark, TopNav, PhaseTracker
  confidence.tsx        ConfidenceBadge + 4-state semantic helpers
  profile-view.tsx      Profile result cards (left-border + badge pattern)
  evidence-result.tsx   Per-photo finding cards + dropzone

lib/                  Domain logic, no React
  anthropic.ts          Conversational profiler client + single-shot helper
  vision.ts             Photo evidence extraction
  whisper.ts            OpenAI Whisper transcription
  schema.ts             Zod schemas for profile + conversation
  evidenceSchema.ts     Zod schemas for vision findings
  prompts.ts            System prompt for the profiler
  visionPrompt.ts       System prompt for vision
  messages.ts           Bilingual UI strings (AR + EN)
  vocabulary.ts         Bilingual labels for enum values + chip identifiers

scripts/              CLI utilities (Node + tsx)
  profiler.ts           Single-shot CLI
  conversation-test.ts  Multi-turn smoke test
  evidence.ts           Vision pipeline CLI

fixtures/             Test data
  transcript-{ar,en}.txt   Sample narratives for the profiler
  photos/                  11 calibration photos (Wikipedia / Wikimedia Commons, CC licenses)
  evidence/                Pre-computed vision outputs, one JSON per photo
```

---

## Tech

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4
- **AI:** Claude Sonnet 4.6 via `@anthropic-ai/sdk@^0.98` (chat + vision, with prompt caching enabled) · OpenAI Whisper via `openai@^6.39` (voice transcription)
- **Validation:** Zod (every LLM output is schema-validated before reaching the UI)
- **Voice:** Browser `MediaRecorder` API → Whisper API
- **Fonts:** Google Fonts — Fraunces (display) · DM Sans (UI) · Cairo (Arabic) · JetBrains Mono (eyebrows / timestamps / sources)

---

## Design system

This implementation follows a published design system:

- **Palette** — Terracotta `#B85C38`, warm cream `#FAF0EB`, four semantic confidence colors (`#1D9E75` Confirmed · `#BA7517` Uncertain · `#888780` Unknown · `#A32D2D` Likely inadequate).
- **Typography** — Fraunces for display moments, DM Sans for UI body, Cairo for Arabic, JetBrains Mono for technical accents.
- **Components** — Left-border + pill-badge cards, circular-icon dropzone, dark resilience score band, chat bubbles, sticky top nav with phase tracker.
- **Accessibility** — WCAG AA minimum · 44×44 px tap targets · 2 px terra focus rings · color never used alone · body text ≥ 16 px · no diagnostic language anywhere.

---

## Status

| Feature | State |
|---|---|
| F1.2 · Conversational needs profiler with follow-up loop | ✅ shipped |
| F6 · Voice input (AR + EN) | ✅ shipped |
| F3 · Evidence extractor + per-photo finding cards | ✅ shipped |
| Editorial landing page + phase tracker chrome | ✅ shipped |
| Bilingual AR/EN with RTL + Cairo | ✅ shipped |
| F4 · Journey report — resilience score + auto-drafted asks | 🚧 next |
| Phase 03 · explicit analysis screen | 🚧 next |
| Hosted demo on Vercel | 🚧 next |

---

## License

Not yet decided. For the hackathon submission this is a working prototype, not a redistributable library. Code in this repo is provided as-is for review by KSCDR judges and the project's client.
