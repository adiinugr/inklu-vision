import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ModuleForm from "@/components/guru/ModuleForm";
import { updateModule } from "@/lib/actions/module";
import { QuestionType } from "@prisma/client";

export const metadata = {
  title: "Edit Modul — InkluVision",
};

export default async function EditModulPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/guru/login");

  const mod = await prisma.module.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!mod || mod.authorId !== session.user.id) {
    notFound();
  }

  const initialData = {
    id: mod.id,
    title: mod.title,
    description: mod.description,
    content: mod.content,
    publishedAt: mod.publishedAt,
    questions: mod.questions.map((q) => ({
      id: q.id,
      type: q.type as QuestionType,
      questionText: q.questionText,
      options: q.options as string[] | null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? "",
      order: q.order,
    })),
  };

  // Bind the module id so the Server Action signature matches ModuleForm's onSubmit
  const updateModuleWithId = updateModule.bind(null, id);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/guru/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Dasbor
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900">Edit Modul</h1>
        <p className="mt-1 text-sm text-zinc-500">{mod.title}</p>
      </div>

      <ModuleForm
        initialData={initialData}
        onSubmit={updateModuleWithId}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
