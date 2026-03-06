"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface AIExplanationProps {
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
}

type State = "idle" | "loading" | "success" | "error";

export default function AIExplanation({
  questionText,
  correctAnswer,
  studentAnswer,
}: AIExplanationProps) {
  const [state, setState] = useState<State>("idle");
  const [penjelasan, setPenjelasan] = useState("");

  async function handleMinta() {
    setState("loading");
    try {
      const res = await fetch("/api/ai-penjelasan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText, correctAnswer, studentAnswer }),
      });
      const data = await res.json();
      if (res.ok) {
        setPenjelasan(data.penjelasan);
        setState("success");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-2">
      {state === "idle" && (
        <Button variant="ghost" className="text-xs" onClick={handleMinta}>
          Minta penjelasan AI
        </Button>
      )}

      <div role="status" aria-live="polite" aria-atomic="true">
        {state === "loading" && (
          <p className="mt-2 text-sm text-zinc-500">
            Memuat penjelasan dari AI...
          </p>
        )}
        {state === "success" && (
          <div className="mt-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Penjelasan AI
            </p>
            {penjelasan}
          </div>
        )}
        {state === "error" && (
          <p className="mt-2 text-sm text-red-600">
            Gagal mendapatkan penjelasan. Coba lagi nanti.
          </p>
        )}
      </div>
    </div>
  );
}
