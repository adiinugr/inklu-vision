"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ParsedCommand =
  | { type: "ULANGI" }
  | { type: "ULANGI_AWAL" }
  | { type: "LANJUTKAN" }
  | { type: "JEDA" }
  | { type: "BERIKUTNYA" }
  | { type: "SEBELUMNYA" }
  | { type: "BERHENTI" }
  | { type: "MULAI" }
  | { type: "JAWAB"; option: string }
  | { type: "REVEAL_ANSWER" }
  | { type: "SELESAI" }
  | { type: "KE_HOME" }
  | { type: "CARI"; query: string }
  | { type: "ULANGI_BAGIAN"; query: string }
  | { type: "UNKNOWN"; raw: string };

export interface UseVoiceCommandsReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  lastRawTranscript: string;
}

function parseCommand(transcript: string): ParsedCommand {
  const t = transcript.toLowerCase().trim();

  // ULANGI_AWAL must come before ULANGI (both contain "ulangi")
  if (
    t.includes("dari awal") ||
    t.includes("mulai dari awal") ||
    t.includes("ulangi dari awal")
  )
    return { type: "ULANGI_AWAL" };

  // KE_HOME
  if (
    t.includes("kembali ke home") ||
    t.includes("ke beranda") ||
    t.includes("halaman utama") ||
    t.includes("ke home")
  )
    return { type: "KE_HOME" };

  // CARI: "cari [materi] [tentang] X"
  const cariMatch = t.match(/cari(?:\s+materi)?(?:\s+tentang)?\s+(.+)/);
  if (cariMatch) {
    return { type: "CARI", query: cariMatch[1].trim() };
  }

  // ULANGI_BAGIAN
  const ulangiMatch = t.match(
    /(?:ulangi bagian|baca bagian|pindah ke bagian)\s+(.+)/
  );
  if (ulangiMatch) {
    return { type: "ULANGI_BAGIAN", query: ulangiMatch[1].trim() };
  }

  if (t.includes("ulangi") || t.includes("ulang")) return { type: "ULANGI" };

  if (t.includes("jeda") || t.includes("tahan") || t.includes("pause"))
    return { type: "JEDA" };

  if (t.includes("lanjutkan") || t.includes("teruskan") || t === "lanjut")
    return { type: "LANJUTKAN" };

  if (
    t.includes("selanjutnya") ||
    t.includes("berikutnya") ||
    t.includes("bagian berikutnya")
  )
    return { type: "BERIKUTNYA" };

  if (t.includes("sebelumnya") || t.includes("bagian sebelumnya"))
    return { type: "SEBELUMNYA" };

  if (t.includes("berhenti") || t.includes("stop"))
    return { type: "BERHENTI" };

  if (t.includes("mulai") || t.includes("baca") || t.includes("putar") || t.includes("play"))
    return { type: "MULAI" };

  if (t.includes("selesai") || t.includes("kirim") || t.includes("submit"))
    return { type: "SELESAI" };

  // "jawab" alone (no letter after) = reveal the correct answer for practice questions
  if (/^jawab\.?$/.test(t)) {
    return { type: "REVEAL_ANSWER" };
  }

  // --- Answer detection ---
  // 1. Phrase-based: "jawab a", "jawaban b", "jawabannya c", "pilih d", "huruf a"
  const answerPhraseMatch = t.match(
    /(?:jawab(?:an)?(?:nya)?|pilih|huruf)\s+([a-d])\b/
  );
  if (answerPhraseMatch) {
    return { type: "JAWAB", option: answerPhraseMatch[1] };
  }

  // 2. Standalone single letter: user just says "a", "b", "c", or "d"
  if (/^[a-d]\.?$/.test(t)) {
    return { type: "JAWAB", option: t.replace(".", "") };
  }

  // 3. Indonesian letter pronunciations (id-ID ASR renders letters by name):
  //    B → "be", C → "ce" or "se", D → "de"
  const idLetterMap: Record<string, string> = {
    be: "b",
    ce: "c",
    se: "c",
    de: "d",
  };
  if (idLetterMap[t] !== undefined) {
    return { type: "JAWAB", option: idLetterMap[t] };
  }

  // 4. Letter at the end of a short phrase: "saya pilih a", "jawaban saya b"
  //    Only match short transcripts (≤ 5 words) to avoid false positives
  const answerEndMatch = t.match(/\b([a-d])\.?$/);
  if (answerEndMatch && t.trim().split(/\s+/).length <= 5) {
    return { type: "JAWAB", option: answerEndMatch[1] };
  }

  return { type: "UNKNOWN", raw: transcript };
}

export function useVoiceCommands(
  onCommand: (command: ParsedCommand) => void
): UseVoiceCommandsReturn {
  // Start false to match SSR; set true after mount if browser supports it
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setIsSupported(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "SpeechRecognition" in window || "webkitSpeechRecognition" in (window as any)
    );
  }, []);
  const [lastRawTranscript, setLastRawTranscript] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const onCommandRef = useRef(onCommand);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  const createRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in (window as any))) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "id-ID";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const transcript: string = last[0].transcript;
      setLastRawTranscript(transcript);
      const command = parseCommand(transcript);
      onCommandRef.current(command);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return; // expected — keep going
      console.warn("[VoiceCommands] recognition error:", event.error);
      if (event.error === "network") {
        if (isListeningRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                // ignore
              }
            }
          }, 1000);
        }
      } else if (event.error === "aborted") {
        // Triggered by recognition.stop() — not a real error, onend will handle restart
      } else {
        // For any other error, discard the broken recognition object so
        // the next startListening() creates a fresh one instead of reusing it.
        setIsListening(false);
        isListeningRef.current = false;
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startListening() {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in (window as any))) return;

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition();
    }

    if (!isListeningRef.current) {
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch {
        // already started
      }
    }
  }

  function stopListening() {
    isListeningRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    lastRawTranscript,
  };
}
