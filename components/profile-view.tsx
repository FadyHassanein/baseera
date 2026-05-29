import type { Profile } from "@/lib/schema";
import type { Lang, Messages } from "@/lib/messages";
import { labelFor } from "@/lib/vocabulary";
import {
  BORDER_BY_STATE,
  ConfidenceBadge,
  stateForConfidence,
  stateLabel,
} from "./confidence";

export function ProfileView({
  profile,
  t,
  lang,
}: {
  profile: Profile;
  t: Messages;
  lang: Lang;
}) {
  const summaryDir = profile.language === "ar" ? "rtl" : "ltr";

  return (
    <section className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-[var(--color-brand-pale)] px-3 py-1 text-xs font-medium text-[var(--color-brand-dark)]">
          {t.languageLabel}: {profile.language.toUpperCase()}
        </span>
        <p className="text-xs text-[var(--color-ink-3)] leading-relaxed">
          {t.confidenceNote}
          <span className="ms-2 text-[var(--color-confirmed)]">●</span> {t.stateConfirmed}
          <span className="ms-2 text-[var(--color-uncertain)]">●</span> {t.stateUncertain}
          <span className="ms-2 text-[var(--color-unknown)]">●</span> {t.stateUnknown}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-border-soft)] bg-white p-5 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
          {t.narrativeSummary}
        </div>
        <p
          dir={summaryDir}
          className="mt-2 text-base leading-relaxed text-[var(--color-ink-1)]"
        >
          {profile.narrative_summary}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DimensionCard title={t.mobility} confidence={profile.mobility.confidence} t={t}>
          <Field
            label={t.level}
            value={labelFor("mobility_level", profile.mobility.level, lang)}
          />
          <ChipsField
            label={t.specifics}
            items={profile.mobility.specifics}
            category="specifics"
            lang={lang}
            t={t}
          />
        </DimensionCard>

        <DimensionCard title={t.bathroom} confidence={profile.bathroom.confidence} t={t}>
          <ChipsField
            label={t.requirements}
            items={profile.bathroom.requirements}
            category="requirements"
            lang={lang}
            t={t}
          />
        </DimensionCard>

        <DimensionCard title={t.stamina} confidence={profile.stamina.confidence} t={t}>
          <Field
            label={t.walkingDistance}
            value={labelFor("walking_distance", profile.stamina.walking_distance_tolerance, lang)}
          />
          <Field
            label={t.restNeeded}
            value={profile.stamina.rest_needed ? t.yes : t.no}
          />
        </DimensionCard>

        <DimensionCard title={t.sensory} confidence={profile.sensory.confidence} t={t}>
          <Field label={t.vision} value={labelFor("vision", profile.sensory.vision, lang)} />
          <Field label={t.hearing} value={labelFor("hearing", profile.sensory.hearing, lang)} />
        </DimensionCard>

        <DimensionCard title={t.cognitive} confidence={profile.cognitive.confidence} t={t}>
          <Field
            label={t.wayfindingNeeded}
            value={profile.cognitive.wayfinding_support_needed ? t.yes : t.no}
          />
          <Field
            label={t.sensoryOverload}
            value={profile.cognitive.sensory_overload_concern ? t.yes : t.no}
          />
        </DimensionCard>

        <DimensionCard title={t.equipment} confidence={profile.equipment.confidence} t={t}>
          <ChipsField
            label={t.items}
            items={profile.equipment.items}
            category="equipment"
            lang={lang}
            t={t}
          />
        </DimensionCard>
      </div>

      <details
        className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 text-sm"
        dir="ltr"
      >
        <summary className="cursor-pointer font-medium text-[var(--color-ink-2)]">
          {t.showRawJson}
        </summary>
        <pre className="mt-3 overflow-auto text-xs text-[var(--color-ink-2)]">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function DimensionCard({
  title,
  confidence,
  t,
  children,
}: {
  title: string;
  confidence: number;
  t: Messages;
  children: React.ReactNode;
}) {
  const pct = Math.round(confidence * 100);
  const state = stateForConfidence(confidence);

  return (
    <div
      className={`rounded-r-lg border border-[var(--color-border-soft)] border-l-4 ${BORDER_BY_STATE[state]} bg-white p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <h3 className="font-display text-lg font-semibold text-[var(--color-ink-1)]">
          {title}
        </h3>
        <ConfidenceBadge state={state} pct={pct} label={stateLabel(state, t)} />
      </div>
      <div className="space-y-3 text-base">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
        {label}
      </div>
      <div className="mt-0.5 text-[var(--color-ink-1)]">{value}</div>
    </div>
  );
}

function ChipsField({
  label,
  items,
  category,
  lang,
  t,
}: {
  label: string;
  items: string[];
  category: "specifics" | "requirements" | "equipment";
  lang: Lang;
  t: Messages;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
        {label}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-[var(--color-ink-3)] text-sm italic">{t.noneItem}</span>
        ) : (
          items.map((item) => (
            <span
              key={item}
              dir="auto"
              className="inline-flex items-center rounded-md bg-[var(--color-brand-pale)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-dark)]"
              title={item}
            >
              {labelFor(category, item, lang)}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
