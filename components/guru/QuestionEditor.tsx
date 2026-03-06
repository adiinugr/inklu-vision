"use client";

import { QuestionType } from "@prisma/client";
import { X, Plus } from "lucide-react";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import LatexEditor from "@/components/guru/LatexEditor";
import type { QuestionInput } from "@/lib/actions/module";

interface QuestionEditorProps {
  question: QuestionInput;
  index: number;
  onChange: (index: number, updated: QuestionInput) => void;
  onRemove: (index: number) => void;
}

const typeLabels: Record<QuestionType, string> = {
  EXAMPLE: "Contoh — ditampilkan dengan penjelasan",
  PRACTICE: "Latihan — siswa menjawab secara mandiri",
  EVALUATION: "Evaluasi — dinilai dan masuk skor",
};

const typeBadge: Record<QuestionType, string> = {
  EXAMPLE: "bg-blue-50 text-blue-700 border-blue-200",
  PRACTICE: "bg-amber-50 text-amber-700 border-amber-200",
  EVALUATION: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const typeShort: Record<QuestionType, string> = {
  EXAMPLE: "Contoh",
  PRACTICE: "Latihan",
  EVALUATION: "Evaluasi",
};

export default function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: QuestionEditorProps) {
  function update(field: keyof QuestionInput, value: unknown) {
    onChange(index, { ...question, [field]: value });
  }

  function updateOption(optIndex: number, value: string) {
    const opts = [...(question.options ?? [])];
    opts[optIndex] = value;
    update("options", opts);
  }

  function addOption() {
    update("options", [...(question.options ?? []), ""]);
  }

  function removeOption(optIndex: number) {
    const opts = (question.options ?? []).filter((_, i) => i !== optIndex);
    update("options", opts.length > 0 ? opts : null);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
            {index + 1}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeBadge[question.type]}`}
          >
            {typeShort[question.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label={`Hapus soal ${index + 1}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Hapus
        </button>
      </div>

      <div className="space-y-5 p-5">
        {/* Question type */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`type-${index}`}>Tipe Soal</Label>
          <select
            id={`type-${index}`}
            value={question.type}
            onChange={(e) => update("type", e.target.value as QuestionType)}
            className="min-h-[44px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
          >
            {Object.entries(typeLabels).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Question text with live preview */}
        <LatexEditor
          id={`question-text-${index}`}
          label="Teks Soal"
          value={question.questionText}
          onChange={(val) => update("questionText", val)}
          placeholder={`Contoh: Tentukan akar-akar dari $x^2 - 5x + 6 = 0$`}
          minHeight="100px"
          required
        />

        {/* Answer options */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label>Pilihan Jawaban (opsional)</Label>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Tambah Pilihan
            </button>
          </div>

          {(question.options ?? []).length > 0 ? (
            <div className="space-y-2">
              {(question.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs font-bold text-zinc-600">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <Input
                    aria-label={`Pilihan ${String.fromCharCode(65 + i)}`}
                    placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    aria-label={`Hapus pilihan ${String.fromCharCode(65 + i)}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-3 text-xs text-zinc-400 border border-zinc-200">
              Kosongkan jika soal berupa isian bebas.
            </p>
          )}
        </div>

        {/* Correct answer */}
        <Input
          id={`correct-${index}`}
          label="Jawaban Benar"
          placeholder="Masukkan jawaban yang benar (misal: A, atau teks lengkap)"
          value={question.correctAnswer}
          onChange={(e) => update("correctAnswer", e.target.value)}
          required
        />

        {/* Explanation (shown for EXAMPLE type) */}
        <LatexEditor
          id={`explanation-${index}`}
          label={
            question.type === "EXAMPLE"
              ? "Penjelasan (wajib untuk tipe Contoh)"
              : "Penjelasan (opsional)"
          }
          value={question.explanation ?? ""}
          onChange={(val) => update("explanation", val)}
          placeholder="Jelaskan langkah penyelesaian soal ini..."
          minHeight="80px"
        />
      </div>
    </div>
  );
}
