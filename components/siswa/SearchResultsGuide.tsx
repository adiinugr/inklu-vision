"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Volume2 } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";

interface Props {
  results: { slug: string; title: string }[];
  query: string;
}

const ANGKA = ["satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];

const NUMBER_MAP: Record<string, number> = {
  satu: 1, "1": 1, dua: 2, "2": 2, tiga: 3, "3": 3, empat: 4, "4": 4,
  lima: 5, "5": 5, enam: 6, "6": 6, tujuh: 7, "7": 7, delapan: 8, "8": 8,
  sembilan: 9, "9": 9,
};

function buildAnnouncement(results: { title: string }[], query: string): string {
  if (results.length === 0) {
    return `Tidak ada modul untuk kata kunci ${query}. Ucapkan kata kunci lain untuk mencari lagi.`;
  }
  const capped = results.slice(0, 9);
  const list = capped.map((r, i) => `${ANGKA[i]}, ${r.title}`).join(". ");
  const guide =
    capped.length === 1
      ? `Ucapkan satu untuk membuka ${capped[0].title}.`
      : `Pilih nomornya. ${capped.map((_, i) => `${ANGKA[i]} untuk ${capped[i].title}`).join(", atau ")}. Ucapkan nomornya sekarang.`;
  return `${list}. ${guide}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRecognition(): any | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!("SpeechRecognition" in w) && !("webkitSpeechRecognition" in w)) return null;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = new SR();
  r.continuous = true;
  r.interimResults = false;
  r.lang = "id-ID";
  return r;
}

type Phase = "reading" | "listening" | "listening-new-query" | "idle";

export default function SearchResultsGuide({ results, query }: Props) {
  const router = useRouter();
  const { speak, stop: stopTTS, isSupported: ttsSupported } = useTTS();
  const [phase, setPhase] = useState<Phase>("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  function stopRecognition() {
    isListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
  }

  // Listen for a number word → navigate to modul
  function startNumberListening() {
    const recognition = createRecognition();
    if (!recognition) { setPhase("idle"); return; }

    stopRecognition();
    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setPhase("listening");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      const transcript = last[0].transcript.toLowerCase().trim();

      // Scan every word — handles "satu", "nomor satu", "pilih satu", "yang pertama", etc.
      for (const word of transcript.split(/\s+/)) {
        const n = NUMBER_MAP[word];
        if (n && n <= results.length) {
          stopRecognition();
          router.push(`/modul/${results[n - 1].slug}`);
          return;
        }
      }
      // No match — keep listening (continuous, nothing to do)
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "network" && isListeningRef.current) {
        setTimeout(() => { try { recognition.start(); } catch { /* ignore */ } }, 1000);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    try { recognition.start(); } catch { /* ignore */ }
  }

  // Listen for free-form speech → new search query
  function startNewQueryListening() {
    const recognition = createRecognition();
    if (!recognition) { setPhase("idle"); return; }

    stopRecognition();
    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setPhase("listening-new-query");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      const transcript = last[0].transcript.trim();
      if (transcript.length > 1) {
        stopRecognition();
        router.push(`/?q=${encodeURIComponent(transcript)}`);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "network" && isListeningRef.current) {
        setTimeout(() => { try { recognition.start(); } catch { /* ignore */ } }, 1000);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    try { recognition.start(); } catch { /* ignore */ }
  }

  function afterTTS() {
    if (results.length === 0) {
      startNewQueryListening();
    } else {
      startNumberListening();
    }
  }

  function handleRepeat() {
    stopRecognition();
    stopTTS();
    setPhase("reading");
    speak(buildAnnouncement(results, query), afterTTS);
  }

  useEffect(() => {
    if (!ttsSupported) { setPhase("idle"); return; }
    setPhase("reading");
    speak(buildAnnouncement(results, query), afterTTS, () => setPhase("idle"));

    return () => {
      stopRecognition();
      stopTTS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsSupported]);

  if (phase === "reading") {
    return (
      <div
        className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" aria-hidden="true" />
        <span className="text-sm text-zinc-500">Membacakan hasil pencarian...</span>
        <button
          onClick={handleRepeat}
          className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 rounded"
          aria-label="Ulangi pembacaan hasil"
        >
          Ulangi
        </button>
      </div>
    );
  }

  if (phase === "listening") {
    const hint =
      results.length === 1
        ? "Ucapkan: satu"
        : `Ucapkan nomornya — ${results.slice(0, 9).map((_, i) => ANGKA[i]).join(", ")}`;
    return (
      <div
        className="mt-4 flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3"
        role="status"
        aria-live="assertive"
      >
        <Mic className="h-5 w-5 animate-pulse text-red-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-zinc-700">{hint}</span>
        <button
          onClick={handleRepeat}
          className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 rounded"
          aria-label="Ulangi panduan pemilihan"
        >
          Ulangi
        </button>
      </div>
    );
  }

  if (phase === "listening-new-query") {
    return (
      <div
        className="mt-4 flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3"
        role="status"
        aria-live="assertive"
      >
        <Mic className="h-5 w-5 animate-pulse text-red-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-zinc-700">
          Saya mendengarkan — ucapkan kata kunci baru
        </span>
      </div>
    );
  }

  // idle / fallback
  return (
    <button
      onClick={handleRepeat}
      className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2"
      aria-label="Dengarkan hasil pencarian"
    >
      <Volume2 className="h-4 w-4" aria-hidden="true" />
      Dengarkan hasil
    </button>
  );
}
