"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./messages";

const LANG_KEY = "accesslens.lang.v1";

// Shared, persisted language selection. Every page uses this instead of its own
// useState so switching language on one page carries to the next (and into the
// photo-analysis request). Initializes to "en" to match the server-rendered HTML,
// then reads the saved choice on mount.
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      /* localStorage unavailable — fall back to default */
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore persistence failure */
    }
  }

  return [lang, setLang];
}
