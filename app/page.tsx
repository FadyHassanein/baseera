"use client";

import { useState } from "react";
import Link from "next/link";
import { messages } from "@/lib/messages";
import { useLang } from "@/lib/use-lang";
import { TopNav, BrandMark } from "@/components/chrome";

const LANDING_CONTENT = {
  en: {
    hero: {
      eyebrow: "Open beta · free to try",
      titleA: "Visit any place,",
      titleB: "knowingly.",
      subtitleA: "AccessLens reads photos and descriptions of any place — homes, cafés, clinics, public spaces — and tells you, in plain language, what is ",
      subtitleConfirmed: "confirmed",
      subtitleComma: ", ",
      subtitleUncertain: "uncertain",
      subtitleOr: ", or genuinely ",
      subtitleUnknown: "unknown",
      subtitleEnd: ".",
      ctaPrimary: "Start my profile",
      ctaSecondary: "Continue last session",
      trust: [
        "5-minute profile",
        "No login required to start",
        "Profile is yours to keep",
      ],
    },
    previewBathroom: {
      title: "Bathroom access",
      body: "Walk-in shower confirmed in photo 3. Grab bar visible. Threshold ≈ 1″.",
      state: "Confirmed",
      pct: 88,
    },
    previewParking: {
      title: "Parking distance",
      body: 'Host wrote "free parking" — distance, surface, slope not stated.',
      state: "Unknown",
      pct: 12,
    },
    previewScore: {
      eyebrow: "Place resilience",
      label: "Two questions to ask before going.",
      label2: "Backup options available for both.",
    },
    how: {
      eyebrow: "How it works",
      titleA: "Four phases.",
      titleB: "About 8 minutes.",
      intro: "No filters. No checkboxes. We never ask you to translate your needs into a category.",
      phases: [
        { n: "01", name: "Needs profile", desc: "A short, conversational profile. No forms, no diagnostic language.", time: "5 min" },
        { n: "02", name: "Add a place", desc: "Drop in photos, descriptions, or a link. Any place, any order.", time: "2 min" },
        { n: "03", name: "We read the evidence", desc: "Vision models read the photos. Confidence is scored per dimension.", time: "90 s" },
        { n: "04", name: "One honest report", desc: "A trust score, sourced findings, and a draft message for each weak link.", time: "Yours forever" },
      ],
      startCta: "Start with my profile",
    },
    honesty: {
      eyebrow: 'Why we say "uncertain"',
      title: "A confident wrong answer is the most expensive mistake an accessibility product can make.",
      body: "AccessLens never overstates confidence. When a photo doesn't show the thing it needs to, we say so — and we draft the message to the venue on your behalf. Every claim names its source. Every uncertainty gets its own plain-language label. Trust is earned line by line.",
    },
    faq: {
      eyebrow: "Common questions",
      title: "Before you start.",
      items: [
        {
          q: "Do I need an account to start?",
          a: "No. Build a profile and run your first place analysis without signing in. Create an account only if you want to save your profile.",
        },
        {
          q: "What does \u201cuncertain\u201d mean exactly?",
          a: "It means the evidence in the photos or descriptions is partial. The feature is visible or mentioned but a critical detail — height, width, distance — isn't verifiable from what we have. We always tell you what is missing.",
        },
        {
          q: "Does this work for any kind of place?",
          a: "Yes — homes, cafés, restaurants, clinics, mosques, government service centres, workplaces, public spaces. Anywhere you can take photos or paste a description.",
        },
        {
          q: "How is my profile stored?",
          a: "You own it. It lives locally first. You can export it as a portable JSON file any time.",
        },
      ],
    },
  },
  ar: {
    hero: {
      eyebrow: "نسخة تجريبية · مجاناً",
      titleA: "زُر أي مكان،",
      titleB: "عن وعي.",
      subtitleA: "يقرأ تطبيق AccessLens صور وأوصاف أي مكان — منازل، مقاهٍ، عيادات، أماكن عامة — ويخبرك، بلغة واضحة، ما هو ",
      subtitleConfirmed: "مؤكد",
      subtitleComma: "، ",
      subtitleUncertain: "غير مؤكد",
      subtitleOr: "، أو غير ",
      subtitleUnknown: "معروف فعلاً",
      subtitleEnd: ".",
      ctaPrimary: "ابدأ ملفي",
      ctaSecondary: "تابع الجلسة الأخيرة",
      trust: [
        "ملف في ٥ دقائق",
        "لا حاجة لتسجيل دخول للبدء",
        "الملف ملكك",
      ],
    },
    previewBathroom: {
      title: "الوصول إلى الحمام",
      body: "دوش بدون حاجز مؤكد في الصورة ٣. مساند يدوية ظاهرة. ارتفاع العتبة ≈ ٢٫٥ سم.",
      state: "مؤكد",
      pct: 88,
    },
    previewParking: {
      title: "بُعد موقف السيارة",
      body: 'كتب المضيف "موقف مجاني" — المسافة والسطح والميل غير مذكورة.',
      state: "غير معروف",
      pct: 12,
    },
    previewScore: {
      eyebrow: "ثقة المكان",
      label: "سؤالان لطرحهما قبل الذهاب.",
      label2: "بدائل احتياطية متاحة لكليهما.",
    },
    how: {
      eyebrow: "كيف يعمل",
      titleA: "أربع مراحل.",
      titleB: "نحو ٨ دقائق.",
      intro: "لا فلاتر. لا خانات اختيار. لا نطلب منك ترجمة احتياجاتك إلى تصنيف.",
      phases: [
        { n: "٠١", name: "ملف الاحتياجات", desc: "ملف قصير وحواري. لا استمارات، لا مصطلحات طبية.", time: "٥ دقائق" },
        { n: "٠٢", name: "أضف مكاناً", desc: "اسحب الصور أو الأوصاف أو رابطاً. أي مكان، بأي ترتيب.", time: "دقيقتان" },
        { n: "٠٣", name: "نقرأ الأدلة", desc: "نماذج الرؤية تقرأ الصور. الثقة مُقيّمة لكل بُعد.", time: "٩٠ ثانية" },
        { n: "٠٤", name: "تقرير صادق واحد", desc: "درجة ثقة، نتائج موثقة، ومسودة رسالة لكل نقطة ضعف.", time: "ملكك للأبد" },
      ],
      startCta: "ابدأ من ملفي",
    },
    honesty: {
      eyebrow: "لماذا نقول «غير مؤكد»",
      title: "إجابة خاطئة بثقة هي أغلى خطأ يمكن أن يرتكبه منتج للوصول.",
      body: "تطبيق AccessLens لا يبالغ في الثقة أبداً. حين لا تُظهر الصورة ما يلزم، نقول ذلك — ونصيغ الرسالة للمكان نيابةً عنك. كل ادعاء يذكر مصدره. كل عدم يقين له تسميته الواضحة. الثقة تُكسب سطراً بسطر.",
    },
    faq: {
      eyebrow: "أسئلة شائعة",
      title: "قبل أن تبدأ.",
      items: [
        {
          q: "هل أحتاج حساباً للبدء؟",
          a: "لا. أنشئ ملفاً وحلل أول مكان بدون تسجيل. أنشئ حساباً فقط إذا أردت حفظ ملفك.",
        },
        {
          q: "ما معنى «غير مؤكد» بدقة؟",
          a: "يعني أن الأدلة في الصور أو الأوصاف جزئية. الميزة موجودة أو مذكورة لكن تفصيلاً حرجاً — ارتفاع، عرض، مسافة — غير قابل للتحقق مما لدينا. نخبرك دائماً بما هو ناقص.",
        },
        {
          q: "هل يعمل لأي نوع من الأماكن؟",
          a: "نعم — منازل، مقاهٍ، مطاعم، عيادات، مساجد، مراكز خدمات حكومية، أماكن عمل، أماكن عامة. أي مكان يمكنك تصويره أو لصق وصف له.",
        },
        {
          q: "كيف يُحفظ ملفي؟",
          a: "ملكك أنت. يُحفظ محلياً أولاً. صدّره ملف JSON متنقل في أي وقت.",
        },
      ],
    },
  },
} as const;

export default function LandingPage() {
  const [lang, setLang] = useLang();
  const t = messages[lang];
  const c = LANDING_CONTENT[lang];
  const isAr = lang === "ar";

  return (
    <>
      <TopNav
        phase={null}
        lang={lang}
        setLang={setLang}
        t={t}
        rightSlot={
          <Link
            href="/profile"
            className="hidden md:inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
          >
            {c.hero.ctaPrimary}
            <span aria-hidden>{isAr ? "←" : "→"}</span>
          </Link>
        }
      />

      <main dir={isAr ? "rtl" : "ltr"} lang={lang}>
        {/* HERO */}
        <section className="px-10 pb-16 pt-22">
          <div
            className="mx-auto grid max-w-[1200px] items-center gap-20"
            style={{ gridTemplateColumns: "1.05fr .95fr" }}
          >
            <div>
              <Eyebrow>{c.hero.eyebrow}</Eyebrow>
              <h1 className="font-display text-[clamp(56px,7vw,84px)] font-medium leading-[1.0] tracking-[-0.035em] text-[var(--color-ink-1)] m-0">
                {c.hero.titleA}
                <br />
                <em className="not-italic font-medium text-[var(--color-brand)]">{c.hero.titleB}</em>
              </h1>
              <p className="mt-7 max-w-[540px] text-[19px] leading-[1.55] text-[var(--color-ink-2)]">
                {c.hero.subtitleA}
                <em className="font-display not-italic text-[var(--color-confirmed-text)]">
                  {c.hero.subtitleConfirmed}
                </em>
                {c.hero.subtitleComma}
                <em className="font-display not-italic text-[var(--color-uncertain-text)]">
                  {c.hero.subtitleUncertain}
                </em>
                {c.hero.subtitleOr}
                <em className="font-display not-italic text-[var(--color-ink-1)]">{c.hero.subtitleUnknown}</em>
                {c.hero.subtitleEnd}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/profile"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--color-brand)] px-7 py-4 text-[15px] font-medium text-white shadow-sm hover:bg-[var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
                >
                  {c.hero.ctaPrimary} <span aria-hidden>{isAr ? "←" : "→"}</span>
                </Link>
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center rounded-lg border border-[var(--color-border-soft)] bg-white px-5 py-3 text-[14px] font-medium text-[var(--color-ink-1)] hover:bg-[var(--color-brand-pale)]"
                >
                  {c.hero.ctaSecondary}
                </button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-ink-3)]">
                {c.hero.trust.map((it, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <CheckIcon /> {it}
                  </span>
                ))}
              </div>
            </div>
            <LandingPreview content={c} />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-y border-[var(--color-border-soft)] bg-[var(--color-surface)] px-10 py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-12">
              <div>
                <Eyebrow>{c.how.eyebrow}</Eyebrow>
                <h2 className="font-display text-[44px] font-medium leading-[1.1] tracking-[-0.02em] m-0">
                  {c.how.titleA}{" "}
                  <em className="not-italic text-[var(--color-brand)]">{c.how.titleB}</em>
                </h2>
              </div>
              <p className="m-0 max-w-[380px] text-[15px] leading-[1.65] text-[var(--color-ink-2)]">
                {c.how.intro}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-4">
              {c.how.phases.map((p, i) => (
                <div
                  key={p.n}
                  className="rounded-[14px] border border-[var(--color-border-soft)] bg-white p-[28px_24px]"
                  style={{
                    borderTop: `3px solid ${
                      i === 0
                        ? "var(--color-brand)"
                        : i === 1
                        ? "var(--color-brand-light)"
                        : i === 2
                        ? "var(--color-border-soft)"
                        : "var(--color-ink-1)"
                    }`,
                  }}
                >
                  <div className="mb-3.5 flex items-baseline justify-between">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[var(--color-ink-3)]">
                      PHASE {p.n}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[var(--color-brand)]">
                      {p.time}
                    </span>
                  </div>
                  <h3 className="font-display m-0 mb-2 text-[22px] font-medium tracking-[-0.01em] text-[var(--color-ink-1)]">
                    {p.name}
                  </h3>
                  <p className="m-0 text-[14px] leading-[1.6] text-[var(--color-ink-2)]">{p.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-9 text-center">
              <Link
                href="/profile"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--color-brand)] px-7 py-4 text-[15px] font-medium text-white shadow-sm hover:bg-[var(--color-brand-dark)]"
              >
                {c.how.startCta} <span aria-hidden>{isAr ? "←" : "→"}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* HONESTY */}
        <section className="bg-[var(--color-ink-1)] px-10 py-24 text-white">
          <div className="mx-auto max-w-[880px]">
            <div className="font-mono mb-5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--color-brand-light)]">
              {c.honesty.eyebrow}
            </div>
            <h2 className="font-display m-0 mb-8 text-[clamp(36px,4.5vw,52px)] font-medium leading-[1.15] tracking-[-0.025em] text-white">
              {c.honesty.title}
            </h2>
            <p className="m-0 max-w-[680px] text-[17px] leading-[1.7] text-white/[0.78]">
              {c.honesty.body}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection items={c.faq.items} eyebrow={c.faq.eyebrow} title={c.faq.title} />

        {/* FOOTER */}
        <footer className="border-t border-[var(--color-border-soft)] bg-[var(--color-page-bg)] px-10 py-10">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <BrandMark size={22} />
              <span dir="ltr" className="font-display text-[18px] font-semibold text-[var(--color-brand)]">
                AccessLens
              </span>
              <span className="text-[var(--color-ink-3)] text-xs ms-2">· {t.tagline}</span>
            </div>
            <div className="font-mono text-[11px] tracking-[0.06em] text-[var(--color-ink-3)]">
              v3.0 · 2026 · Riyadh
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono mb-3.5 text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-brand)]">
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type LandingContent = (typeof LANDING_CONTENT)[keyof typeof LANDING_CONTENT];

function LandingPreview({ content }: { content: LandingContent }) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-[var(--color-border-soft)] p-9"
      style={{
        aspectRatio: "4/5",
        background: "linear-gradient(160deg, #fdf6f0 0%, #f4ebe1 55%, #ece2d2 100%)",
      }}
    >
      <PreviewCard
        position={{ top: 36, left: 32, right: 32 }}
        title={content.previewBathroom.title}
        body={content.previewBathroom.body}
        state="confirmed"
        pct={content.previewBathroom.pct}
        stateLabel={content.previewBathroom.state}
      />
      <PreviewCard
        position={{ top: 200, left: 60, right: 48 }}
        title={content.previewParking.title}
        body={content.previewParking.body}
        state="unknown"
        pct={content.previewParking.pct}
        stateLabel={content.previewParking.state}
        rotate={-1.5}
      />
      <div
        className="absolute rounded-[14px] p-[22px_24px] text-white"
        style={{
          bottom: 36,
          left: 32,
          right: 32,
          background: "var(--color-ink-1)",
          boxShadow: "0 24px 48px -16px rgba(0,0,0,.3)",
        }}
      >
        <div className="flex items-center gap-5">
          <div className="font-display text-[56px] font-semibold leading-none text-[var(--color-brand-light)]">
            74
          </div>
          <div>
            <div className="font-mono mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
              {content.previewScore.eyebrow}
            </div>
            <div className="text-[12px] leading-[1.55] text-white/80">
              {content.previewScore.label}
              <br />
              {content.previewScore.label2}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  position,
  title,
  body,
  state,
  pct,
  stateLabel,
  rotate,
}: {
  position: { top: number; left: number; right: number };
  title: string;
  body: string;
  state: "confirmed" | "unknown";
  pct: number;
  stateLabel: string;
  rotate?: number;
}) {
  const bg = state === "confirmed" ? "var(--color-confirmed)" : "var(--color-unknown)";
  return (
    <div
      className="absolute rounded-[14px] border border-[var(--color-border-soft)] bg-white p-[18px_22px]"
      style={{
        ...position,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        boxShadow: "0 1px 0 rgba(0,0,0,.02), 0 8px 24px -16px rgba(0,0,0,.08)",
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[var(--color-ink-1)]">{title}</span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
          style={{ background: bg }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          {stateLabel} · {pct}%
        </span>
      </div>
      <p className="m-0 text-[13px] leading-[1.55] text-[var(--color-ink-2)]">{body}</p>
    </div>
  );
}

function FAQSection({
  items,
  eyebrow,
  title,
}: {
  items: ReadonlyArray<{ q: string; a: string }>;
  eyebrow: string;
  title: string;
}) {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className="px-10 py-24">
      <div className="mx-auto max-w-[880px]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="font-display m-0 mb-8 text-[36px] font-medium leading-[1.15] tracking-[-0.02em]">
          {title}
        </h2>
        <div className="border-t border-[var(--color-border-soft)]">
          {items.map((it, i) => (
            <div key={i} className="border-b border-[var(--color-border-soft)]">
              <button
                type="button"
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between bg-transparent py-6 text-[17px] font-medium text-[var(--color-ink-1)] hover:text-[var(--color-brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] rounded-md"
                aria-expanded={open === i}
              >
                <span className="text-start">{it.q}</span>
                <span
                  className="ms-4 inline-block text-[22px] text-[var(--color-brand)] transition-transform duration-300"
                  style={{ transform: open === i ? "rotate(45deg)" : "rotate(0)" }}
                  aria-hidden
                >
                  +
                </span>
              </button>
              {open === i && (
                <p className="m-0 max-w-[640px] pb-6 text-[15px] leading-[1.7] text-[var(--color-ink-2)]">
                  {it.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
