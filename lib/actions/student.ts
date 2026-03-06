"use server";

import { prisma } from "@/lib/prisma";
import { hitungSkor } from "@/lib/utils";

export type AnswerRecord = {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
};

export type EvaluationPayload = {
  moduleId: string;
  studentName: string;
  studentClass: string;
  answers: AnswerRecord[];
};

export async function submitEvaluation(
  payload: EvaluationPayload
): Promise<{ score: number }> {
  const benar = payload.answers.filter((a) => a.isCorrect).length;
  const score = hitungSkor(benar, payload.answers.length);

  await prisma.studentResult.create({
    data: {
      moduleId: payload.moduleId,
      studentName: payload.studentName,
      studentClass: payload.studentClass,
      score,
      answers: payload.answers,
    },
  });

  return { score };
}
