"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { generateUniqueAccessCode } from "@/lib/access-code";
import { QuestionType } from "@prisma/client";

export type QuestionInput = {
  id?: string;
  type: QuestionType;
  questionText: string;
  options?: string[] | null;
  correctAnswer: string;
  explanation?: string;
  order: number;
};

export type ModuleInput = {
  title: string;
  description?: string;
  content: string;
  publishedAt?: Date | null;
  questions: QuestionInput[];
};

export async function createModule(data: ModuleInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Tidak diizinkan");

  const slug = generateSlug(data.title);
  const accessCode = await generateUniqueAccessCode();

  const mod = await prisma.$transaction(async (tx) => {
    const created = await tx.module.create({
      data: {
        title: data.title,
        slug,
        accessCode,
        description: data.description,
        content: data.content,
        publishedAt: data.publishedAt,
        authorId: session.user!.id!,
      },
    });

    if (data.questions.length > 0) {
      await tx.question.createMany({
        data: data.questions.map((q) => ({
          moduleId: created.id,
          type: q.type,
          questionText: q.questionText,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: q.order,
        })),
      });
    }

    return created;
  });

  revalidatePath("/guru/dashboard");
  redirect(`/guru/modul/${mod.id}/edit`);
}

export async function updateModule(id: string, data: ModuleInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Tidak diizinkan");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.module.findUnique({ where: { id } });
    if (!existing || existing.authorId !== session.user!.id) {
      throw new Error("Modul tidak ditemukan atau akses ditolak");
    }

    await tx.module.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        publishedAt: data.publishedAt,
      },
    });

    await tx.question.deleteMany({ where: { moduleId: id } });

    if (data.questions.length > 0) {
      await tx.question.createMany({
        data: data.questions.map((q) => ({
          moduleId: id,
          type: q.type,
          questionText: q.questionText,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: q.order,
        })),
      });
    }
  });

  revalidatePath("/guru/dashboard");
  revalidatePath(`/guru/modul/${id}/edit`);
  redirect("/guru/dashboard");
}

export async function deleteModule(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Tidak diizinkan");

  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing || existing.authorId !== session.user.id) {
    throw new Error("Modul tidak ditemukan atau akses ditolak");
  }

  await prisma.module.delete({ where: { id } });

  revalidatePath("/guru/dashboard");
  redirect("/guru/dashboard");
}
