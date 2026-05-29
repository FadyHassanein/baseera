"use client";

import { useEffect, useRef, useState } from "react";
import { submitProfilerTurn, transcribeAudio } from "../actions";
import type { Profile, ConversationMessage } from "@/lib/schema";
import { messages, type Lang, type Messages } from "@/lib/messages";
import { ProfileView } from "@/components/profile-view";
import { TopNav } from "@/components/chrome";
import { saveProfile, clearProfile, clearReport } from "@/lib/storage";

type VoiceState = "idle" | "recording" | "transcribing";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SAMPLE_AR = `قبل سنتين صار لي جلطة في المخ. من بعدها صار جانبي اليسار أضعف من اليمين بكثير، وما أقدر أمشي مسافة طويلة بدون ما أرتاح. الدرج صعب علي مرة، ولازم أجلس وقت الاستحمام لأني ما أقدر أوقف فترة طويلة. أستخدم عصاية أحياناً، خصوصاً لما أكون في مكان جديد ما أعرفه. سمعي وبصري الحمد لله طبيعيين.`;

const SAMPLE_EN = `I've been a manual wheelchair user for about eight years. I can transfer to a chair or toilet on my own as long as there's at least three feet of clear space next to whatever I'm transferring to. Doorways under thirty-two inches are tight. I also have some vision loss in my right eye that mostly affects me in dim lighting. Stairs are obviously a no-go, and I prefer venues where I can park close to the entrance because pushing long distances over uneven ground tires me out.`;

export default function ProfilePage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = messages[lang];

  const [conversation, setConversation] = useState<ConversationMessage[]>([
    { role: "assistant", content: messages.en.openingPrompt },
  ]);
  const [pendingInput, setPendingInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationStarted = conversation.some((m) => m.role === "user");

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation, submitting]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 320) + "px";
  }, [pendingInput]);

  useEffect(() => {
    if (!conversationStarted && !profile) {
      setConversation([{ role: "assistant", content: messages[lang].openingPrompt }]);
    }
  }, [lang, conversationStarted, profile]);

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function handleSend() {
    const text = pendingInput.trim();
    if (!text || submitting || profile) return;

    setErrorMsg(null);
    const newConversation: ConversationMessage[] = [
      ...conversation,
      { role: "user", content: text },
    ];
    setConversation(newConversation);
    setPendingInput("");
    setSubmitting(true);

    const apiMessages: ConversationMessage[] = newConversation.map((m) =>
      m.role === "assistant"
        ? {
            role: "assistant",
            content: JSON.stringify({ type: "question", text: m.content }),
          }
        : m
    );

    const result = await submitProfilerTurn(apiMessages);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }

    if (result.turn.type === "question") {
      setConversation([
        ...newConversation,
        { role: "assistant", content: result.turn.text },
      ]);
    } else {
      setProfile(result.turn.profile);
      saveProfile(result.turn.profile);
    }
  }

  function handleStartOver() {
    setConversation([{ role: "assistant", content: t.openingPrompt }]);
    setProfile(null);
    setPendingInput("");
    setErrorMsg(null);
    clearProfile();
    clearReport();
  }

  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) {
          setVoiceState("idle");
          return;
        }

        setVoiceState("transcribing");

        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        formData.append("lang", lang);

        const result = await transcribeAudio(formData);

        if (result.error || !result.transcript) {
          setVoiceError(result.error || "No transcript returned.");
          setVoiceState("idle");
          return;
        }

        setPendingInput((prev) =>
          prev.trim() ? `${prev.trim()} ${result.transcript}` : result.transcript ?? ""
        );
        setVoiceState("idle");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setVoiceState("recording");
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      const e = err as Error;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setVoiceError(t.micDenied);
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setVoiceError(t.micUnavailable);
      } else {
        setVoiceError(e.message || "Microphone error");
      }
      setVoiceState("idle");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }

  const inputDisabled = submitting || voiceState !== "idle" || !!profile;

  return (
    <>
      <TopNav phase="profile" lang={lang} setLang={setLang} t={t} />
      <main
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
        className="mx-auto max-w-3xl px-6 py-10"
      >
        <div className="mb-8">
          <div className="font-mono text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--color-brand)]">
            {t.phaseProfile} · 01 / 04
          </div>
          <h1 className="font-display mt-3 text-[44px] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--color-ink-1)]">
            {t.subtitle}
          </h1>
        </div>

        <section
        aria-live="polite"
        className="flex flex-col gap-3 mb-6 min-h-[120px]"
      >
        {conversation.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} text={msg.content} t={t} />
        ))}
        {submitting && <PendingBubble t={t} />}
        <div ref={threadEndRef} />
      </section>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <strong>{t.errorPrefix}:</strong> {errorMsg}
        </div>
      )}

      {!profile && (
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-3 shadow-sm">
          <label htmlFor="chat-input" className="sr-only">
            {t.chatPlaceholder}
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={pendingInput}
            onChange={(e) => setPendingInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!inputDisabled && pendingInput.trim()) handleSend();
              }
            }}
            rows={2}
            dir="auto"
            disabled={inputDisabled}
            placeholder={t.chatPlaceholder}
            style={{ maxHeight: "320px" }}
            className="w-full resize-none overflow-y-auto bg-transparent px-3 py-2 text-base text-[var(--color-ink-1)] placeholder:text-[var(--color-ink-3)] focus:outline-none disabled:opacity-60"
          />
          <div className="mt-2 flex items-center gap-2 px-1">
            {voiceState === "idle" && (
              <button
                type="button"
                onClick={startRecording}
                disabled={inputDisabled}
                aria-label={t.startRecordingAria}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border-soft)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-brand-pale)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span aria-hidden>🎤</span>
                {t.speak}
              </button>
            )}

            {voiceState === "recording" && (
              <button
                type="button"
                onClick={stopRecording}
                aria-label={t.recordingAria}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--color-inadequate)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-inadequate)] focus-visible:ring-offset-2"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full bg-white animate-pulse"
                  aria-hidden
                />
                {t.stopRecording} {formatTime(recordingSeconds)}
              </button>
            )}

            {voiceState === "transcribing" && (
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink-3)]"
              >
                {t.transcribing}
              </button>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={inputDisabled || !pendingInput.trim()}
              className="ms-auto inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.sendMessage}
            </button>
          </div>

          {voiceError && (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {voiceError}
            </div>
          )}

          {!conversationStarted && (
            <div className="mt-3 flex flex-wrap items-center gap-3 px-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-[var(--color-ink-3)]">
                {lang === "ar" ? "جرّب نموذجاً:" : "Try a sample:"}
              </span>
              <button
                type="button"
                onClick={() => setPendingInput(SAMPLE_AR)}
                disabled={submitting}
                className="text-[var(--color-ink-2)] underline-offset-2 hover:underline hover:text-[var(--color-brand)] disabled:opacity-50"
              >
                {t.loadArabic}
              </button>
              <button
                type="button"
                onClick={() => setPendingInput(SAMPLE_EN)}
                disabled={submitting}
                className="text-[var(--color-ink-2)] underline-offset-2 hover:underline hover:text-[var(--color-brand)] disabled:opacity-50"
              >
                {t.loadEnglish}
              </button>
              {pendingInput && (
                <button
                  type="button"
                  onClick={() => setPendingInput("")}
                  className="ms-auto text-[var(--color-ink-2)] underline-offset-2 hover:underline hover:text-[var(--color-brand)]"
                >
                  {t.clear}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {profile && (
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleStartOver}
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--color-border-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-brand-pale)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
          >
            {t.startOver}
          </button>
          <a
            href="/evidence"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
          >
            {t.continueToPlaces}
            <span aria-hidden>{lang === "ar" ? "←" : "→"}</span>
          </a>
        </div>
      )}

      {profile && <ProfileView profile={profile} t={t} lang={lang} />}
      </main>
    </>
  );
}

function ChatBubble({
  role,
  text,
  t,
}: {
  role: "user" | "assistant";
  text: string;
  t: Messages;
}) {
  const isAI = role === "assistant";
  return (
    <div className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}>
      <div
        className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${
          isAI ? "text-[var(--color-ink-3)]" : "text-[var(--color-brand-light)]"
        }`}
      >
        {isAI ? t.baseeraLabel : t.youLabel}
      </div>
      <div
        dir="auto"
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-base leading-relaxed ${
          isAI
            ? "bg-[var(--color-surface)] text-[var(--color-ink-1)] rounded-bl-sm"
            : "bg-[var(--color-brand)] text-white rounded-br-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function PendingBubble({ t }: { t: Messages }) {
  return (
    <div className="flex flex-col items-start">
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-1 text-[var(--color-ink-3)]">
        {t.baseeraLabel}
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[var(--color-surface)] px-4 py-3">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink-3)] animate-pulse" />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink-3)] animate-pulse"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink-3)] animate-pulse"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

