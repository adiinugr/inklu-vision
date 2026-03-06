"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Indonesian ASR often transcribes "vision" as "visi", "visian", "fisyon", etc.
const WAKE_WORDS = [
  "hi vision", "hei vision", "hai vision", "hey vision",
  "hi visi", "hei visi", "hai visi", "hey visi",
  "hi fisyon", "hai fisyon",
  "inklu vision", "inklu visi",
];

export type WakeWordPhase = "wakeword" | "query";

export interface UseWakeWordReturn {
  phase: WakeWordPhase;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

export function useWakeWord(onQuery: (query: string) => void): UseWakeWordReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [phase, setPhase] = useState<WakeWordPhase>("wakeword");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const phaseRef = useRef<WakeWordPhase>("wakeword");
  const onQueryRef = useRef(onQuery);

  useEffect(() => {
    onQueryRef.current = onQuery;
  }, [onQuery]);

  useEffect(() => {
    setIsSupported(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "SpeechRecognition" in window || "webkitSpeechRecognition" in (window as any)
    );
  }, []);

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
      const transcript = last[0].transcript.toLowerCase().trim();

      if (phaseRef.current === "wakeword") {
        if (WAKE_WORDS.some(w => transcript.includes(w))) {
          phaseRef.current = "query";
          setPhase("query");
          // Pause recognition while TTS speaks so it doesn't pick up its own audio
          try { recognitionRef.current?.stop(); } catch { /* ignore */ }
          const u = new SpeechSynthesisUtterance("Ya, cari apa?");
          u.lang = "id-ID";
          u.rate = 1.0;
          u.onend = () => {
            // Resume listening for the search query after TTS finishes
            if (isActiveRef.current && phaseRef.current === "query") {
              setTimeout(() => {
                try { recognitionRef.current?.start(); } catch { /* ignore */ }
              }, 150);
            }
          };
          window.speechSynthesis.speak(u);
        }
      } else if (phaseRef.current === "query" && transcript.length > 1) {
        phaseRef.current = "wakeword";
        setPhase("wakeword");
        onQueryRef.current(transcript);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "network") {
        if (isActiveRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                // ignore
              }
            }
          }, 1000);
        }
      } else {
        isActiveRef.current = false;
      }
    };

    recognition.onend = () => {
      if (isActiveRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    return recognition;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in (window as any))) return;

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition();
    }

    if (!isActiveRef.current) {
      isActiveRef.current = true;
      phaseRef.current = "wakeword";
      setPhase("wakeword");
      try {
        recognitionRef.current?.start();
      } catch {
        // already started
      }
    }
  }

  function stop() {
    isActiveRef.current = false;
    phaseRef.current = "wakeword";
    setPhase("wakeword");
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  return { phase, isSupported, start, stop };
}
