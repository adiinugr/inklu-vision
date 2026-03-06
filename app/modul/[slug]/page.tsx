import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ModuleHeader from "@/components/siswa/ModuleHeader";
import QuestionBlock from "@/components/siswa/QuestionBlock";
import EvaluationForm from "@/components/siswa/EvaluationForm";
import MarkdownLatex from "@/components/MarkdownLatex";
import AudioBar from "@/components/siswa/AudioBar";
import { QuestionType } from "@prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mod = await prisma.module.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  if (!mod) return { title: "Modul tidak ditemukan" };

  return {
    title: `${mod.title} — InkluVision`,
    description: mod.description ?? undefined,
  };
}

export default async function ModulPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const mod = await prisma.module.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!mod || !mod.publishedAt) {
    notFound();
  }

  const exampleQuestions = mod.questions.filter(
    (q) => q.type === QuestionType.EXAMPLE
  );
  const practiceQuestions = mod.questions.filter(
    (q) => q.type === QuestionType.PRACTICE
  );
  const evaluationQuestions = mod.questions.filter(
    (q) => q.type === QuestionType.EVALUATION
  );

  // Build audio sections from raw text (before rendering)
  const audioSections = [
    { label: "Materi Pembelajaran", rawText: `${mod.title}.\n\n${mod.content}` },
    ...exampleQuestions.map((q, i) => ({
      label: `Contoh Soal ${i + 1}`,
      rawText:
        q.questionText +
        (q.explanation ? "\n\nPenjelasan: " + q.explanation : ""),
    })),
    ...practiceQuestions.map((q, i) => {
      const opts = q.options as string[] | null;
      const optionsText = opts
        ? "\n\nPilihan: " +
          opts.map((o, j) => `${String.fromCharCode(65 + j)}: ${o}`).join(". ")
        : "";
      return {
        label: `Latihan ${i + 1}`,
        rawText: q.questionText + optionsText,
        interactiveQuestion: {
          options: opts,
          correctAnswer: q.correctAnswer,
        },
      };
    }),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 pb-44 sm:pb-28">
      <ModuleHeader
        title={mod.title}
        description={mod.description}
        accessCode={mod.accessCode}
        authorName={mod.author.name}
        questionCount={mod.questions.length}
      />

      <section aria-labelledby="materi-heading" className="mb-10">
        <h2
          id="materi-heading"
          className="mb-4 text-xl font-bold text-zinc-900"
        >
          Materi
        </h2>
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <MarkdownLatex content={mod.content} />
        </div>
      </section>

      {exampleQuestions.length > 0 && (
        <section aria-labelledby="contoh-heading" className="mb-10">
          <h2
            id="contoh-heading"
            className="mb-4 text-xl font-bold text-zinc-900"
          >
            Contoh Soal
          </h2>
          {exampleQuestions.map((q) => (
            <QuestionBlock
              key={q.id}
              order={q.order}
              questionText={q.questionText}
              type={q.type}
              explanation={q.explanation}
              options={q.options as string[] | null}
            />
          ))}
        </section>
      )}

      {practiceQuestions.length > 0 && (
        <section aria-labelledby="latihan-heading" className="mb-10">
          <h2
            id="latihan-heading"
            className="mb-4 text-xl font-bold text-zinc-900"
          >
            Latihan
          </h2>
          {practiceQuestions.map((q) => (
            <QuestionBlock
              key={q.id}
              order={q.order}
              questionText={q.questionText}
              type={q.type}
              explanation={q.explanation}
              options={q.options as string[] | null}
            />
          ))}
        </section>
      )}

      {evaluationQuestions.length > 0 && (
        <section aria-labelledby="evaluasi-heading" className="mb-10">
          <h2
            id="evaluasi-heading"
            className="mb-4 text-xl font-bold text-zinc-900"
          >
            Evaluasi
          </h2>
          <p className="mb-4 text-zinc-600">
            Kerjakan soal evaluasi berikut untuk mengukur pemahamanmu.
          </p>
          <EvaluationForm
            moduleId={mod.id}
            audioEnabled={true}
            questions={evaluationQuestions.map((q) => ({
              id: q.id,
              questionText: q.questionText,
              options: q.options as string[] | null,
              correctAnswer: q.correctAnswer,
              order: q.order,
            }))}
          />
        </section>
      )}

      <AudioBar sections={audioSections} autoPlay moduleTitle={mod.title} />
    </div>
  );
}
