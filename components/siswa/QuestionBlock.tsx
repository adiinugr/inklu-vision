import Card from "@/components/ui/Card";
import MarkdownLatex from "@/components/MarkdownLatex";
import { QuestionType } from "@prisma/client";

interface QuestionBlockProps {
  order: number;
  questionText: string;
  type: QuestionType;
  explanation?: string | null;
  options?: string[] | null;
}

export default function QuestionBlock({
  order,
  questionText,
  type,
  explanation,
  options,
}: QuestionBlockProps) {
  return (
    <Card className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Soal {order}
      </p>
      <MarkdownLatex content={questionText} />
      {options && options.length > 0 && (
        <ul className="mt-3 space-y-1" aria-label="Pilihan jawaban">
          {options.map((opt, i) => (
            <li key={i} className="text-sm text-zinc-700">
              <span className="font-medium text-zinc-500">
                {String.fromCharCode(65 + i)}.{" "}
              </span>
              {opt}
            </li>
          ))}
        </ul>
      )}
      {type === "EXAMPLE" && explanation && (
        <div className="mt-4 rounded-xl bg-green-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">
            Penjelasan
          </p>
          <MarkdownLatex content={explanation} />
        </div>
      )}
    </Card>
  );
}
