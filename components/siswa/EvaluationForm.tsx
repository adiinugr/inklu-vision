"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MarkdownLatex from "@/components/MarkdownLatex";
import ScoreCard from "@/components/siswa/ScoreCard";
import { submitEvaluation } from "@/lib/actions/student";
import { useTTS } from "@/hooks/useTTS";
import { useVoiceCommands, type ParsedCommand } from "@/hooks/useVoiceCommands";
import { latexToSpeech } from "@/lib/latex-to-speech";

interface Question {
  id: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string;
  order: number;
}

interface AnswerRecord {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
}

interface EvaluationFormProps {
  moduleId: string;
  questions: Question[];
  audioEnabled?: boolean;
}

type Phase = "identity" | "answering" | "submitting" | "complete";

export default function EvaluationForm({
  moduleId,
  questions,
  audioEnabled = false,
}: EvaluationFormProps) {
  const [phase, setPhase] = useState<Phase>("identity");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Audio hooks (only active when audioEnabled)
  const { speak, stop, isSupported: ttsSupported } = useTTS();

  // Refs to allow stable callbacks
  const selectedAnswerRef = useRef(selectedAnswer);
  useEffect(() => {
    selectedAnswerRef.current = selectedAnswer;
  }, [selectedAnswer]);

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Forward refs so handleAnswerSubmit is accessible in voice command handler
  const handleAnswerSubmitRef = useRef<(() => Promise<void>) | undefined>(undefined);

  async function handleAnswerSubmit() {
    if (!selectedAnswerRef.current) {
      setError("Harap pilih atau isi jawaban terlebih dahulu.");
      if (audioEnabled && ttsSupported) {
        speak("Harap pilih atau isi jawaban terlebih dahulu.");
      }
      return;
    }

    setError("");

    const question = questions[currentIndexRef.current];
    const isCorrect =
      selectedAnswerRef.current.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase();

    const newAnswer: AnswerRecord = {
      questionId: question.id,
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      studentAnswer: selectedAnswerRef.current,
      isCorrect,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setSelectedAnswer("");

    if (currentIndexRef.current < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    // Last question — submit
    setPhase("submitting");
    try {
      const result = await submitEvaluation({
        moduleId,
        studentName,
        studentClass,
        answers: updatedAnswers.map((a) => ({
          questionId: a.questionId,
          studentAnswer: a.studentAnswer,
          isCorrect: a.isCorrect,
        })),
      });
      setScore(result.score);
      setPhase("complete");
      const dispatchDone = () =>
        window.dispatchEvent(
          new CustomEvent("inklu:evaluation-complete", { detail: { score: result.score } })
        );
      if (audioEnabled && ttsSupported) {
        speak(
          `Evaluasi selesai. Nilai kamu adalah ${result.score} dari 100.`,
          dispatchDone
        );
      } else {
        dispatchDone();
      }
    } catch {
      setError("Gagal mengirim jawaban. Coba lagi.");
      setPhase("answering");
    }
  }

  useEffect(() => {
    handleAnswerSubmitRef.current = handleAnswerSubmit;
  });

  // Voice command handler for evaluation
  const handleCommand = useCallback((command: ParsedCommand) => {
    if (phaseRef.current !== "answering") return;

    const question = questions[currentIndexRef.current];

    switch (command.type) {
      case "ULANGI": {
        if (!question) return;
        const speechText = buildQuestionSpeech(question, currentIndexRef.current, questions.length);
        speak(speechText);
        break;
      }
      case "JAWAB": {
        if (!question) return;
        if (question.options && question.options.length > 0) {
          const optionIndex = command.option.charCodeAt(0) - "a".charCodeAt(0);
          const matched = question.options[optionIndex];
          if (matched) {
            setSelectedAnswer(matched);
            selectedAnswerRef.current = matched;
            speak(`Kamu memilih ${command.option.toUpperCase()}: ${matched}`);
          } else {
            speak(`Pilihan ${command.option.toUpperCase()} tidak tersedia.`);
          }
        }
        break;
      }
      case "LANJUTKAN":
      case "SELESAI":
        handleAnswerSubmitRef.current?.();
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const { isListening, isSupported: micSupported, startListening, stopListening } =
    useVoiceCommands(handleCommand);

  // Auto-read question when currentIndex changes in answering phase
  useEffect(() => {
    if (!audioEnabled || !ttsSupported || phase !== "answering") return;
    if (!currentQuestion) return;

    const speechText = buildQuestionSpeech(currentQuestion, currentIndex, questions.length);
    speak(speechText, () => {
      // After reading, start listening for voice commands
      if (micSupported) startListening();
    });

    return () => {
      stop();
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase, audioEnabled]);

  // Read identity prompt on mount if audioEnabled
  useEffect(() => {
    if (!audioEnabled || !ttsSupported || phase !== "identity") return;
    speak(
      "Selamat datang di evaluasi. Nama dan kelas bersifat opsional. Tekan Mulai Mengerjakan untuk langsung memulai."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, ttsSupported]);

  function handleStartAnswering() {
    if (!studentName.trim()) setStudentName("Anonim");
    if (!studentClass.trim()) setStudentClass("-");
    setError("");
    setPhase("answering");
  }

  if (phase === "identity") {
    return (
      <Card>
        <h2 className="mb-2 text-xl font-bold text-zinc-900">
          Mulai Evaluasi
        </h2>
        <p className="mb-5 text-sm text-zinc-500">
          Nama dan kelas bersifat opsional — kosongkan jika tidak ingin mengisi.
        </p>
        <div className="space-y-3">
          <Input
            label="Nama Lengkap (opsional)"
            placeholder="Kosongkan untuk anonim"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          <Input
            label="Kelas (opsional)"
            placeholder="Contoh: 10A"
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
          />
          <Button onClick={handleStartAnswering} className="w-full">
            Mulai Mengerjakan
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "complete") {
    return (
      <ScoreCard
        score={score}
        studentName={studentName}
        answers={answers}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="shrink-0 text-sm font-medium text-zinc-500">
          Soal {currentIndex + 1} dari {questions.length}
        </p>
        <div
          className="h-2 flex-1 rounded-full bg-zinc-100"
          aria-label={`Progress: soal ${currentIndex + 1} dari ${questions.length}`}
        >
          <div
            className="h-2 rounded-full bg-zinc-900 transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Mic status badge */}
        {audioEnabled && micSupported && isListening && (
          <span
            aria-live="polite"
            className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600"
          >
            🎤 Mendengarkan...
          </span>
        )}
        {audioEnabled && micSupported && !micSupported && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-500">
            Mikrofon tidak didukung
          </span>
        )}
      </div>

      <div className="mb-6">
        <MarkdownLatex content={currentQuestion.questionText} />
      </div>

      {currentQuestion.options && currentQuestion.options.length > 0 ? (
        <fieldset className="mb-6">
          <legend className="sr-only">Pilih jawaban</legend>
          <div className="space-y-2">
            {currentQuestion.options.map((opt, i) => {
              const optId = `opt-${currentQuestion.id}-${i}`;
              return (
                <label
                  key={optId}
                  htmlFor={optId}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    selectedAnswer === opt
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="radio"
                    id={optId}
                    name={`question-${currentQuestion.id}`}
                    value={opt}
                    checked={selectedAnswer === opt}
                    onChange={() => setSelectedAnswer(opt)}
                    className="h-4 w-4 accent-zinc-900"
                  />
                  <span className="text-sm text-zinc-800">
                    <span className="font-medium text-zinc-500">
                      {String.fromCharCode(65 + i)}.{" "}
                    </span>
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <div className="mb-6">
          <Input
            label="Jawaban kamu"
            placeholder="Ketik jawabanmu di sini"
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={handleAnswerSubmit}
        isLoading={phase === "submitting"}
        className="w-full"
      >
        {isLastQuestion ? "Selesai & Kirim Jawaban" : "Jawaban Berikutnya"}
      </Button>

      {audioEnabled && isLastQuestion && (
        <p className="mt-3 text-center text-xs text-zinc-500">
          Katakan &quot;selesai&quot; atau tekan tombol di atas untuk mengirim.
        </p>
      )}
    </Card>
  );
}

function buildQuestionSpeech(
  question: { questionText: string; options: string[] | null },
  index: number,
  total: number
): string {
  const qText = latexToSpeech(question.questionText);
  let speech = `Soal ${index + 1} dari ${total}. ${qText}`;

  if (question.options && question.options.length > 0) {
    const optionLetters = ["A", "B", "C", "D"];
    const optionsSpeech = question.options
      .map((opt, i) => `${optionLetters[i]}: ${latexToSpeech(opt)}`)
      .join(". ");
    speech += `. Pilihan: ${optionsSpeech}.`;
  }

  return speech;
}
