"use client";

import { useReducer, useTransition } from "react";
import { QuestionType } from "@prisma/client";
import { Plus, Globe, Lock, AlertCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import QuestionEditor from "@/components/guru/QuestionEditor";
import LatexEditor from "@/components/guru/LatexEditor";
import type { ModuleInput, QuestionInput } from "@/lib/actions/module";

interface ModuleFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    publishedAt: Date | null;
    questions: QuestionInput[];
  };
  onSubmit: (data: ModuleInput) => Promise<void>;
  submitLabel?: string;
}

interface FormState {
  title: string;
  description: string;
  content: string;
  isPublished: boolean;
  questions: QuestionInput[];
  error: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof Omit<FormState, "questions" | "error">; value: string | boolean }
  | { type: "ADD_QUESTION" }
  | { type: "UPDATE_QUESTION"; index: number; question: QuestionInput }
  | { type: "REMOVE_QUESTION"; index: number }
  | { type: "SET_ERROR"; message: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "ADD_QUESTION":
      return {
        ...state,
        questions: [
          ...state.questions,
          {
            type: "PRACTICE" as QuestionType,
            questionText: "",
            options: null,
            correctAnswer: "",
            explanation: "",
            order: state.questions.length + 1,
          },
        ],
      };
    case "UPDATE_QUESTION": {
      const updated = [...state.questions];
      updated[action.index] = action.question;
      return { ...state, questions: updated };
    }
    case "REMOVE_QUESTION":
      return {
        ...state,
        questions: state.questions
          .filter((_, i) => i !== action.index)
          .map((q, i) => ({ ...q, order: i + 1 })),
      };
    case "SET_ERROR":
      return { ...state, error: action.message };
    default:
      return state;
  }
}

export default function ModuleForm({
  initialData,
  onSubmit,
  submitLabel = "Simpan Modul",
}: ModuleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, dispatch] = useReducer(formReducer, {
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    content: initialData?.content ?? "",
    isPublished: !!initialData?.publishedAt,
    questions: initialData?.questions ?? [],
    error: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.title.trim() || !state.content.trim()) {
      dispatch({ type: "SET_ERROR", message: "Judul dan materi wajib diisi." });
      return;
    }
    dispatch({ type: "SET_ERROR", message: "" });
    startTransition(async () => {
      try {
        await onSubmit({
          title: state.title,
          description: state.description || undefined,
          content: state.content,
          publishedAt: state.isPublished ? new Date() : null,
          questions: state.questions,
        });
      } catch {
        dispatch({ type: "SET_ERROR", message: "Gagal menyimpan modul. Coba lagi." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Section 1: Info Modul ─────────────────────────────────── */}
      <section aria-labelledby="info-heading" className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: "#FF385C" }}
            aria-hidden="true"
          />
          <h2 id="info-heading" className="text-base font-bold text-zinc-900">
            Informasi Modul
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            id="module-title"
            label="Judul Modul"
            placeholder="Contoh: Persamaan Kuadrat Kelas X"
            value={state.title}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })
            }
            required
          />
          <Textarea
            id="module-desc"
            label="Deskripsi Singkat (opsional)"
            placeholder="Jelaskan secara singkat isi modul ini..."
            value={state.description}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "description", value: e.target.value })
            }
            className="min-h-[80px]"
          />
        </div>
      </section>

      {/* ── Section 2: Materi ─────────────────────────────────────── */}
      <section aria-labelledby="materi-heading" className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: "#FF385C" }}
            aria-hidden="true"
          />
          <h2 id="materi-heading" className="text-base font-bold text-zinc-900">
            Materi Pembelajaran
          </h2>
        </div>

        <LatexEditor
          id="module-content"
          label="Konten Materi"
          value={state.content}
          onChange={(val) =>
            dispatch({ type: "SET_FIELD", field: "content", value: val })
          }
          placeholder={"Tuliskan materi pembelajaran di sini...\n\nContoh:\n## Persamaan Kuadrat\n\nBentuk umum: $ax^2 + bx + c = 0$\n\nRumus akar:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"}
          minHeight="280px"
          required
        />
      </section>

      {/* ── Section 3: Publikasi ──────────────────────────────────── */}
      <section aria-labelledby="publish-heading" className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: "#FF385C" }}
            aria-hidden="true"
          />
          <h2 id="publish-heading" className="text-base font-bold text-zinc-900">
            Pengaturan Publikasi
          </h2>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={state.isPublished}
          onClick={() =>
            dispatch({ type: "SET_FIELD", field: "isPublished", value: !state.isPublished })
          }
          className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            state.isPublished
              ? "border-emerald-200 bg-emerald-50"
              : "border-zinc-200 bg-zinc-50"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              state.isPublished ? "bg-emerald-100" : "bg-zinc-200"
            }`}
          >
            {state.isPublished ? (
              <Globe className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            ) : (
              <Lock className="h-5 w-5 text-zinc-500" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${state.isPublished ? "text-emerald-800" : "text-zinc-700"}`}>
              {state.isPublished ? "Dipublikasikan" : "Disimpan sebagai Draf"}
            </p>
            <p className={`text-sm ${state.isPublished ? "text-emerald-600" : "text-zinc-500"}`}>
              {state.isPublished
                ? "Modul dapat diakses oleh siswa"
                : "Hanya kamu yang dapat melihat modul ini"}
            </p>
          </div>
          {/* Visual toggle */}
          <div
            className={`relative h-6 w-11 rounded-full transition-colors ${
              state.isPublished ? "bg-emerald-500" : "bg-zinc-300"
            }`}
            aria-hidden="true"
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                state.isPublished ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      </section>

      {/* ── Section 4: Soal-soal ──────────────────────────────────── */}
      <section aria-labelledby="questions-heading" className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-1 w-8 rounded-full"
              style={{ backgroundColor: "#FF385C" }}
              aria-hidden="true"
            />
            <h2 id="questions-heading" className="text-base font-bold text-zinc-900">
              Soal-soal{" "}
              <span className="ml-1 text-sm font-normal text-zinc-400">
                ({state.questions.length})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_QUESTION" })}
            className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Soal
          </button>
        </div>

        {state.questions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center">
            <p className="mb-1 text-sm font-medium text-zinc-500">Belum ada soal</p>
            <p className="text-xs text-zinc-400">
              Klik &quot;Tambah Soal&quot; untuk menambahkan soal pertama.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {state.questions.map((q, i) => (
              <QuestionEditor
                key={i}
                question={q}
                index={i}
                onChange={(idx, updated) =>
                  dispatch({ type: "UPDATE_QUESTION", index: idx, question: updated })
                }
                onRemove={(idx) => dispatch({ type: "REMOVE_QUESTION", index: idx })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Error ────────────────────────────────────────────────── */}
      {state.error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full min-h-[52px] items-center justify-center rounded-2xl text-base font-semibold text-white transition-opacity disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ backgroundColor: "#FF385C" }}
        aria-busy={isPending}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            Menyimpan...
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
