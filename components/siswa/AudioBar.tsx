"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import { useVoiceCommands, type ParsedCommand } from "@/hooks/useVoiceCommands";
import { latexToSpeech } from "@/lib/latex-to-speech";

export interface AudioSection {
  label: string;
  rawText: string;
  /** If set, AudioBar enters interactive answering mode after reading this section */
  interactiveQuestion?: {
    options: string[] | null;
    correctAnswer: string;
  };
}

interface AudioBarProps {
  sections: AudioSection[];
  autoPlay?: boolean;
  moduleTitle?: string;
}

function findSectionByQuery(sections: AudioSection[], query: string): number {
  const q = query.toLowerCase();
  const exact = sections.findIndex((s) => s.label.toLowerCase() === q);
  if (exact >= 0) return exact;
  const partial = sections.findIndex((s) => s.label.toLowerCase().includes(q));
  if (partial >= 0) return partial;
  return sections.findIndex((s) => q.includes(s.label.toLowerCase()));
}

export default function AudioBar({ sections, autoPlay = false, moduleTitle }: AudioBarProps) {
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [statusText, setStatusText] = useState(
    autoPlay ? "Memuat panduan suara..." : "Tekan Putar atau tekan Spasi untuk mulai membaca"
  );
  const [showHelp, setShowHelp] = useState(false);
  // "awaiting_answer" = after reading a practice question, waiting for user voice answer
  const [mode, setMode] = useState<"reading" | "awaiting_answer">("reading");
  const modeRef = useRef<"reading" | "awaiting_answer">("reading");
  // Refs so functions defined before useVoiceCommands can call start/stopListening
  const startListeningRef = useRef<(() => void) | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  // Token counter: after each speak ends, only restart mic if no new speak started
  const speakCountRef = useRef(0);

  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported: ttsSupported } =
    useTTS();

  // Use refs so callbacks always see latest values without recreating recognition
  const currentIndexRef = useRef(currentSectionIndex);
  useEffect(() => {
    currentIndexRef.current = currentSectionIndex;
  }, [currentSectionIndex]);

  const isSpeakingRef = useRef(isSpeaking);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  /**
   * Speak text, stop mic first, then restart mic after it ends —
   * UNLESS a new speak() was chained inside onEnd (detected via speakCountRef).
   * This replaces the fragile pausedForSpeechRef/useEffect mechanism.
   */
  function speakAndMic(text: string, onEnd?: () => void, onError?: () => void) {
    speakCountRef.current += 1;
    stopListeningRef.current?.();
    speak(text, () => {
      // Capture BEFORE onEnd — if onEnd immediately calls speakAndMic, counter will advance
      const countBefore = speakCountRef.current;
      onEnd?.();
      if (speakCountRef.current === countBefore) {
        // onEnd did NOT immediately chain another speak → restart mic after echo delay
        setTimeout(() => {
          if (speakCountRef.current === countBefore) {
            startListeningRef.current?.();
          }
        }, 350);
      }
      // If counter changed inside onEnd, that new speakAndMic call owns the mic restart
    }, onError);
  }

  // Idle timer: after reading ends, prompt user then turn off mic if still silent
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startIdleTimerRef = useRef<((isSecondChance: boolean) => void) | null>(null);

  function clearIdleTimer() {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }

  function handleAllDone() {
    setCurrentSectionIndex(sections.length - 1);
    currentIndexRef.current = sections.length - 1;
    setStatusText("Selesai membaca semua bagian");
    if (autoPlay) {
      speakAndMic(
        "Semua materi dan latihan sudah selesai. Silakan kerjakan soal evaluasi yang ada di bawah.",
        () => {
          document.getElementById("evaluasi-heading")?.scrollIntoView({ behavior: "smooth" });
          startIdleTimerRef.current?.(false);
        }
      );
    }
  }

  function advanceFromInteractive() {
    const next = currentIndexRef.current + 1;
    if (next < sections.length) {
      readSection(next);
    } else {
      handleAllDone();
    }
  }

  function handleInteractiveJawab(option: string) {
    const section = sections[currentIndexRef.current];
    if (!section?.interactiveQuestion) return;
    const { options, correctAnswer } = section.interactiveQuestion;

    if (options && options.length > 0) {
      const optionIndex = option.charCodeAt(0) - "a".charCodeAt(0);
      const matched = options[optionIndex];
      if (!matched) {
        speakAndMic(`Pilihan ${option.toUpperCase()} tidak tersedia. Coba lagi.`);
        return;
      }
      const isCorrect = option.toLowerCase() === correctAnswer.trim().toLowerCase();
      let feedback: string;
      if (isCorrect) {
        feedback = `Benar! Jawaban ${option.toUpperCase()} adalah ${matched}.`;
      } else {
        const correctIdx = correctAnswer.trim().toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
        const correctText = options[correctIdx] ?? correctAnswer;
        feedback = `Kurang tepat. Kamu memilih ${option.toUpperCase()}: ${matched}. Jawaban yang benar adalah ${correctAnswer.toUpperCase()}: ${correctText}.`;
      }
      setMode("reading");
      modeRef.current = "reading";
      speakAndMic(feedback, () => setTimeout(advanceFromInteractive, 800));
    }
  }

  function handleRevealAnswer() {
    const section = sections[currentIndexRef.current];
    if (!section?.interactiveQuestion) return;
    const { options, correctAnswer } = section.interactiveQuestion;
    let answerText: string;
    if (options && options.length > 0) {
      const correctIdx = correctAnswer.trim().toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
      const correctText = options[correctIdx] ?? correctAnswer;
      answerText = `Jawaban yang benar adalah ${correctAnswer.toUpperCase()}: ${correctText}.`;
    } else {
      answerText = `Jawaban yang benar adalah: ${correctAnswer}.`;
    }
    setMode("reading");
    modeRef.current = "reading";
    speakAndMic(answerText, () => setTimeout(advanceFromInteractive, 800));
  }

  function readSection(index: number) {
    if (index < 0 || index >= sections.length) return;
    clearIdleTimer();
    setMode("reading");
    modeRef.current = "reading";
    const section = sections[index];
    const text = section.label + ". " + latexToSpeech(section.rawText);
    setStatusText(`Membaca: ${section.label}...`);
    currentIndexRef.current = index;
    setCurrentSectionIndex(index);
    speakAndMic(text, () => {
      if (section.interactiveQuestion) {
        // After reading the practice question, speak the prompt then wait for answer
        setTimeout(() => {
          speakAndMic(
            "Sebutkan jawabannya, atau katakan jawab jika ingin saya bacakan jawabannya.",
            () => {
              setMode("awaiting_answer");
              modeRef.current = "awaiting_answer";
              setStatusText("Menunggu jawaban Anda...");
              // speakAndMic already restarts the mic 350ms after this onEnd fires
            }
          );
        }, 400);
      } else {
        setTimeout(() => {
          const next = index + 1;
          if (next < sections.length) {
            readSection(next);
          } else {
            handleAllDone();
          }
        }, 1000);
      }
    });
  }

  function goToNext() {
    if (modeRef.current === "awaiting_answer") {
      setMode("reading");
      modeRef.current = "reading";
      advanceFromInteractive();
      return;
    }
    const next = currentIndexRef.current + 1;
    if (next < sections.length) {
      readSection(next);
    } else {
      speakAndMic(
        "Semua materi sudah selesai. Silakan kerjakan soal evaluasi yang ada di bawah.",
        () => {
          document.getElementById("evaluasi-heading")?.scrollIntoView({ behavior: "smooth" });
        }
      );
    }
  }

  function goToPrev() {
    if (modeRef.current === "awaiting_answer") {
      setMode("reading");
      modeRef.current = "reading";
    }
    const prev = currentIndexRef.current - 1;
    if (prev >= 0) {
      readSection(prev);
    }
  }

  function handlePlayPause() {
    if (!isSpeakingRef.current && !isPausedRef.current) {
      startReadingWithMic(currentIndexRef.current);
    } else if (isSpeakingRef.current && !isPausedRef.current) {
      pause();
      setStatusText("Dijeda");
    } else if (isPausedRef.current) {
      resume();
      setStatusText(`Membaca: ${sections[currentIndexRef.current]?.label}...`);
    }
  }

  function handleStop() {
    stop();
    clearIdleTimer();
    setCurrentSectionIndex(0);
    currentIndexRef.current = 0;
    setStatusText("Dihentikan");
  }

  const handleCommand = useCallback((command: ParsedCommand) => {
    clearIdleTimer();

    // ── Awaiting-answer mode: only interactive commands apply ──────────────
    if (modeRef.current === "awaiting_answer") {
      switch (command.type) {
        case "JAWAB":
          handleInteractiveJawab(command.option);
          return;
        case "REVEAL_ANSWER":
          handleRevealAnswer();
          return;
        case "ULANGI":
          // Re-read the question
          readSection(currentIndexRef.current);
          return;
        case "BERIKUTNYA":
        case "LANJUTKAN":
          // Skip question without answering
          setMode("reading");
          modeRef.current = "reading";
          advanceFromInteractive();
          return;
        case "SEBELUMNYA":
          goToPrev();
          return;
        case "BERHENTI":
          stop();
          clearIdleTimer();
          setMode("reading");
          modeRef.current = "reading";
          setStatusText("Dihentikan");
          return;
        case "KE_HOME":
          stop();
          setMode("reading");
          modeRef.current = "reading";
          speakAndMic("Kembali ke beranda", () => router.push("/"));
          return;
        case "CARI":
          stop();
          setMode("reading");
          modeRef.current = "reading";
          speakAndMic(`Mencari ${command.query}`, () =>
            router.push(`/?q=${encodeURIComponent(command.query)}`)
          );
          return;
        default:
          return; // ignore other commands while waiting for an answer
      }
    }

    // ── Normal reading mode ────────────────────────────────────────────────
    switch (command.type) {
      case "ULANGI_AWAL":
        readSection(0);
        break;
      case "ULANGI":
        readSection(currentIndexRef.current);
        break;
      case "JEDA":
        pause();
        setStatusText("Dijeda — ucapkan 'lanjutkan' untuk melanjutkan");
        break;
      case "LANJUTKAN":
        if (isPausedRef.current) {
          resume();
          setStatusText(`Membaca: ${sections[currentIndexRef.current]?.label}...`);
        } else {
          goToNext();
        }
        break;
      case "BERIKUTNYA":
        goToNext();
        break;
      case "SEBELUMNYA":
        goToPrev();
        break;
      case "BERHENTI":
        stop();
        clearIdleTimer();
        setCurrentSectionIndex(0);
        currentIndexRef.current = 0;
        setStatusText("Dihentikan");
        break;
      case "MULAI":
        readSection(currentIndexRef.current);
        break;
      case "KE_HOME":
        stop();
        speakAndMic("Kembali ke beranda", () => router.push("/"));
        break;
      case "CARI":
        stop();
        speakAndMic(`Mencari ${command.query}`, () =>
          router.push(`/?q=${encodeURIComponent(command.query)}`)
        );
        break;
      case "ULANGI_BAGIAN": {
        const idx = findSectionByQuery(sections, command.query);
        if (idx >= 0) {
          readSection(idx);
        } else {
          speakAndMic(`Bagian ${command.query} tidak ditemukan`);
        }
        break;
      }
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isListening, isSupported: micSupported, startListening, stopListening } =
    useVoiceCommands(handleCommand);

  // Keep refs in sync so functions defined above can access start/stopListening
  startListeningRef.current = startListening;
  stopListeningRef.current = stopListening;

  function startReadingWithMic(index: number) {
    readSection(index);
  }

  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  function toggleMic() {
    if (isListeningRef.current) {
      stopListening();
    } else {
      // Cancel any pending/blocked TTS (e.g., autoplay blocked on page refresh)
      // so the mic can acquire the audio device without conflict.
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      speakCountRef.current += 1; // prevent any in-flight speakAndMic from restarting mic
      startListening();
      setStatusText("Perintah suara aktif — ucapkan 'baca' untuk mulai");
    }
  }

  // Idle voice guidance: after reading ends, wait → prompt → wait → turn off mic
  function startIdleTimer(isSecondChance: boolean) {
    clearIdleTimer();
    const delay = isSecondChance ? 10_000 : 15_000;
    idleTimerRef.current = setTimeout(() => {
      if (isSecondChance) {
        stopListening();
        setStatusText("Perintah suara dinonaktifkan. Tekan M untuk mengaktifkan kembali.");
      } else {
        speakAndMic(
          "Adakah yang ingin kamu lakukan? Kamu bisa cari materi atau kembali ke beranda.",
          () => { startIdleTimerRef.current?.(true); }
        );
      }
    }, delay);
  }
  startIdleTimerRef.current = startIdleTimer;

  useEffect(() => () => {
    clearIdleTimer();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrev();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMic();
          break;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-play: speak welcome → start reading → activate mic on mount
  const hasAutoPlayedRef = useRef(false);
  useEffect(() => {
    if (!autoPlay || hasAutoPlayedRef.current || !ttsSupported) return;
    hasAutoPlayedRef.current = true;
    const welcome = moduleTitle
      ? `Modul ${moduleTitle}. Panduan suara aktif. Pembacaan materi akan segera dimulai.`
      : "Panduan suara aktif. Pembacaan materi akan segera dimulai.";
    speakAndMic(
      welcome,
      () => { readSection(0); },
      () => {
        // TTS blocked (fresh page load — browser requires a user gesture first)
        setStatusText("Tekan Spasi atau tombol Baca untuk memulai panduan suara");
        startListening();
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsSupported]);

  // Always-active mic: start as soon as mic is supported.
  // Guard: if a TTS speak has already been queued (speakCountRef > 0), skip —
  // speakAndMic will restart the mic itself after each utterance ends.
  const hasAutoMicRef = useRef(false);
  useEffect(() => {
    if (!autoPlay || hasAutoMicRef.current || !micSupported) return;
    hasAutoMicRef.current = true;
    // Only start if no speak is already queued (avoids mic being on during welcome TTS)
    if (speakCountRef.current === 0) {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micSupported]);

  // Post-evaluation guidance: listen for score event dispatched by EvaluationForm
  useEffect(() => {
    if (!autoPlay) return;
    function onEvalComplete(e: Event) {
      const { score } = (e as CustomEvent<{ score: number }>).detail;
      speakAndMic(
        `Kamu sudah menyelesaikan modul ini dengan nilai ${score} dari seratus. ` +
        `Ucapkan ke beranda untuk kembali ke halaman utama, ` +
        `atau cari diikuti nama topik untuk mencari modul lain, ` +
        `atau ulangi dari awal untuk mengulang materi ini.`
      );
    }
    window.addEventListener("inklu:evaluation-complete", onEvalComplete);
    return () => window.removeEventListener("inklu:evaluation-complete", onEvalComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const currentSection = sections[currentSectionIndex];

  return (
    <div
      role="toolbar"
      aria-label="Kontrol Audio"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-700 bg-zinc-900 px-4 py-3 shadow-2xl"
    >
      <div className="mx-auto max-w-3xl">
        {/* Voice command help panel */}
        {showHelp && (
          <div
            role="region"
            aria-label="Daftar perintah suara"
            aria-live="polite"
            className="mb-2 rounded-xl bg-zinc-800 p-3 text-xs text-zinc-300"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span className="col-span-2 mb-1 font-semibold text-white">Kontrol Bacaan</span>
              <span className="text-zinc-400">&ldquo;Baca&rdquo; / &ldquo;Mulai&rdquo;</span><span>Mulai membaca</span>
              <span className="text-zinc-400">&ldquo;Jeda&rdquo;</span><span>Jeda sebentar</span>
              <span className="text-zinc-400">&ldquo;Lanjutkan&rdquo;</span><span>Lanjutkan dari jeda / bagian berikutnya</span>
              <span className="text-zinc-400">&ldquo;Berhenti&rdquo;</span><span>Hentikan pembacaan</span>
              <span className="text-zinc-400">&ldquo;Ulangi&rdquo;</span><span>Ulangi bagian ini</span>
              <span className="col-span-2 mt-2 mb-1 font-semibold text-white">Menjawab Latihan</span>
              <span className="text-zinc-400">&ldquo;A&rdquo; / &ldquo;B&rdquo; / &ldquo;C&rdquo; / &ldquo;D&rdquo;</span><span>Pilih jawaban</span>
              <span className="text-zinc-400">&ldquo;Jawab&rdquo;</span><span>Minta bacakan jawaban</span>
              <span className="text-zinc-400">&ldquo;Berikutnya&rdquo;</span><span>Lewati soal ini</span>
              <span className="col-span-2 mt-2 mb-1 font-semibold text-white">Navigasi Bagian</span>
              <span className="text-zinc-400">&ldquo;Selanjutnya&rdquo;</span><span>Bagian berikutnya</span>
              <span className="text-zinc-400">&ldquo;Sebelumnya&rdquo;</span><span>Bagian sebelumnya</span>
              <span className="text-zinc-400">&ldquo;Ulangi dari awal&rdquo;</span><span>Mulai dari awal</span>
              <span className="text-zinc-400">&ldquo;Ulangi bagian [nama]&rdquo;</span><span>Loncat ke bagian</span>
              <span className="col-span-2 mt-2 mb-1 font-semibold text-white">Navigasi Halaman</span>
              <span className="text-zinc-400">&ldquo;Ke beranda&rdquo;</span><span>Kembali ke beranda</span>
              <span className="text-zinc-400">&ldquo;Cari [topik]&rdquo;</span><span>Cari materi</span>
            </div>
          </div>
        )}

        {/* ── Mobile layout (< md) ── */}
        <div className="md:hidden space-y-2">
          {/* Row 1: nav + play/pause + stop */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              disabled={currentSectionIndex === 0}
              aria-label="Bagian sebelumnya"
              className="flex min-h-[52px] items-center justify-center rounded-xl px-4 text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={handlePlayPause}
              aria-label={
                isSpeaking && !isPaused
                  ? "Jeda pembacaan"
                  : isPaused
                  ? "Lanjutkan pembacaan"
                  : "Mulai membaca"
              }
              className="flex flex-1 min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white font-semibold text-zinc-900 transition hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isSpeaking && !isPaused ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              <span>
                {isSpeaking && !isPaused
                  ? "Jeda"
                  : isPaused
                  ? "Lanjutkan"
                  : "Baca"}
              </span>
            </button>

            <button
              onClick={handleStop}
              aria-label="Hentikan pembacaan"
              className="flex min-h-[52px] items-center justify-center rounded-xl border border-zinc-600 px-4 text-zinc-300 transition hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Square className="h-5 w-5" />
            </button>

            <button
              onClick={goToNext}
              disabled={currentSectionIndex === sections.length - 1}
              aria-label="Bagian berikutnya"
              className="flex min-h-[52px] items-center justify-center rounded-xl px-4 text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Row 2: mic + section label + help */}
          <div className="flex items-center gap-2">
            {micSupported ? (
              <button
                onClick={toggleMic}
                aria-pressed={isListening}
                aria-label={
                  isListening ? "Matikan mikrofon" : "Aktifkan perintah suara"
                }
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isListening
                    ? "border-red-500 bg-red-500/20 text-red-300"
                    : "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {isListening ? (
                  <Mic className="h-4 w-4 animate-pulse" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
                <span>{isListening ? "Mendengarkan" : "Perintah"}</span>
              </button>
            ) : null}

            {currentSection && (
              <span className="flex-1 truncate text-xs text-zinc-400">
                {currentSectionIndex + 1}/{sections.length}: {currentSection.label}
              </span>
            )}

            <button
              onClick={() => setShowHelp((h) => !h)}
              aria-expanded={showHelp}
              aria-label="Tampilkan daftar perintah suara"
              className="rounded-xl border border-zinc-600 px-2 py-2 text-xs text-zinc-400 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ?
            </button>
          </div>

          {/* Status */}
          <p aria-live="polite" className="truncate text-xs text-zinc-400">
            {mode === "awaiting_answer" ? (
              <span className="font-medium text-yellow-400">Menunggu jawaban — ucapkan A/B/C/D atau &ldquo;jawab&rdquo;</span>
            ) : (
              statusText
            )}
            {isListening && mode !== "awaiting_answer" && (
              <span className="ml-2 font-medium text-red-400">
                🎤 Mendengarkan...
              </span>
            )}
          </p>
        </div>

        {/* ── Desktop layout (md+) ── */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              onClick={goToPrev}
              disabled={currentSectionIndex === 0}
              aria-label="Bagian sebelumnya"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              aria-label={
                isSpeaking && !isPaused
                  ? "Jeda pembacaan"
                  : isPaused
                  ? "Lanjutkan pembacaan"
                  : "Mulai membaca"
              }
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isSpeaking && !isPaused ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>
                {isSpeaking && !isPaused
                  ? "Jeda"
                  : isPaused
                  ? "Lanjutkan"
                  : "Baca"}
              </span>
            </button>

            {/* Stop */}
            <button
              onClick={handleStop}
              aria-label="Hentikan pembacaan"
              className="flex items-center gap-2 rounded-xl border border-zinc-600 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Square className="h-4 w-4" />
              <span>Stop</span>
            </button>

            {/* Next */}
            <button
              onClick={goToNext}
              disabled={currentSectionIndex === sections.length - 1}
              aria-label="Bagian berikutnya"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex-1" />

            {/* Section label */}
            {currentSection && (
              <span className="truncate text-xs text-zinc-400 max-w-[200px]">
                {currentSectionIndex + 1}/{sections.length}: {currentSection.label}
              </span>
            )}

            {/* Mic toggle */}
            {micSupported ? (
              <button
                onClick={toggleMic}
                aria-pressed={isListening}
                aria-label={
                  isListening ? "Matikan mikrofon" : "Aktifkan perintah suara"
                }
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isListening
                    ? "border-red-500 bg-red-500/20 text-red-300"
                    : "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {isListening ? (
                  <Mic className="h-4 w-4 animate-pulse" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
                <span>{isListening ? "Mendengarkan" : "Perintah"}</span>
              </button>
            ) : (
              <span className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-500">
                Mikrofon tidak didukung
              </span>
            )}

            {/* Help toggle */}
            <button
              onClick={() => setShowHelp((h) => !h)}
              aria-expanded={showHelp}
              aria-label="Tampilkan daftar perintah suara"
              className="rounded-xl border border-zinc-600 px-2 py-2 text-xs text-zinc-400 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ?
            </button>

            {!ttsSupported && (
              <span className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-500">
                Audio tidak didukung
              </span>
            )}
          </div>

          {/* Status row */}
          <p
            aria-live="polite"
            className="mt-1.5 truncate text-xs text-zinc-400"
          >
            {statusText}
            {isListening && (
              <span className="ml-2 font-medium text-red-400">
                🎤 Mendengarkan...
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
