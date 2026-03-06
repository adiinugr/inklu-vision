"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Volume2 } from "lucide-react";
import { useWakeWord } from "@/hooks/useWakeWord";

export default function VoiceSearch() {
  const router = useRouter();
  const [showActivate, setShowActivate] = useState(false);
  const hasStartedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { phase, isSupported, start, stop } = useWakeWord((query) => {
    router.push("/?q=" + encodeURIComponent(query));
  });

  const WELCOME =
    "Selamat datang di InkluVision. Ucapkan Hi Vision untuk mencari modul dengan suara, atau ketik di kolom pencarian.";

  function speakWelcome() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    hasStartedRef.current = false;

    const u = new SpeechSynthesisUtterance(WELCOME);
    u.lang = "id-ID";
    u.rate = 0.9;
    u.onstart = () => {
      hasStartedRef.current = true;
      setShowActivate(false);
    };
    u.onend = () => start();
    u.onerror = () => {
      setShowActivate(true);
      start(); // still enable wake word even if TTS blocked
    };
    window.speechSynthesis.speak(u);

    // Fallback: browsers that don't fire onerror for blocked autoplay
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!hasStartedRef.current) setShowActivate(true);
    }, 1500);
  }

  useEffect(() => {
    if (!isSupported) return;
    speakWelcome();
    return () => {
      window.speechSynthesis.cancel();
      stop();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  if (!isSupported) return null;

  // TTS was blocked by browser autoplay policy — user must tap to activate
  if (showActivate) {
    return (
      <button
        onClick={() => { setShowActivate(false); speakWelcome(); }}
        className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        aria-label="Aktifkan panduan suara"
      >
        <Volume2 className="h-4 w-4" aria-hidden="true" />
        Aktifkan Panduan Suara
      </button>
    );
  }

  if (phase === "query") {
    return (
      <div
        className="mt-4 flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3"
        role="status"
        aria-live="assertive"
        aria-label="Mendengarkan pertanyaan pencarian Anda"
      >
        <Mic className="h-5 w-5 animate-pulse text-red-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-zinc-700">
          Cari apa? Saya mendengarkan...
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3"
      role="status"
      aria-live="polite"
      aria-label="Mode pencarian suara aktif. Ucapkan Hi Vision untuk memulai"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden="true" />
      <span className="flex-1 text-sm text-zinc-500">
        Ucapkan <strong className="text-zinc-700">&ldquo;Hi Vision&rdquo;</strong> untuk mencari dengan suara
      </span>
      <button
        onClick={stop}
        aria-label="Matikan mikrofon"
        className="text-xs text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
      >
        Matikan
      </button>
    </div>
  );
}
