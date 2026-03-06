"use client";

import Card from "@/components/ui/Card";
import AIExplanation from "@/components/siswa/AIExplanation";

interface AnswerRecord {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
}

interface ScoreCardProps {
  score: number;
  studentName: string;
  answers: AnswerRecord[];
}

export default function ScoreCard({
  score,
  studentName,
  answers,
}: ScoreCardProps) {
  const wrongAnswers = answers.filter((a) => !a.isCorrect);
  const correct = answers.filter((a) => a.isCorrect).length;

  let scoreLabel = "Perlu Belajar Lagi";
  let scoreColor = "text-red-600";
  if (score >= 80) {
    scoreLabel = "Sangat Baik!";
    scoreColor = "text-green-600";
  } else if (score >= 60) {
    scoreLabel = "Cukup Baik";
    scoreColor = "text-yellow-600";
  }

  return (
    <div>
      <Card className="mb-6 text-center">
        <h2 className="mb-2 text-xl font-bold text-zinc-900">
          Hasil Evaluasi
        </h2>
        <p className="mb-4 text-zinc-600">
          Halo, <strong>{studentName}</strong>! Berikut hasil evaluasimu.
        </p>
        <div className={`text-6xl font-bold ${scoreColor}`} aria-label={`Nilai ${score}`}>
          {score}
        </div>
        <p className={`mt-2 text-lg font-semibold ${scoreColor}`}>
          {scoreLabel}
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          {correct} dari {answers.length} soal dijawab dengan benar
        </p>
      </Card>

      {wrongAnswers.length > 0 && (
        <section aria-labelledby="review-heading">
          <h2
            id="review-heading"
            className="mb-4 text-lg font-bold text-zinc-900"
          >
            Soal yang Perlu Dipelajari Lagi
          </h2>
          <div className="space-y-4">
            {wrongAnswers.map((a) => (
              <Card key={a.questionId} className="border-l-4 border-l-red-300">
                <p className="mb-2 text-sm font-medium text-zinc-800">
                  {a.questionText}
                </p>
                <p className="text-xs text-red-600">
                  Jawabanmu:{" "}
                  <span className="font-semibold">{a.studentAnswer}</span>
                </p>
                <p className="text-xs text-green-700">
                  Jawaban benar:{" "}
                  <span className="font-semibold">{a.correctAnswer}</span>
                </p>
                <AIExplanation
                  questionText={a.questionText}
                  correctAnswer={a.correctAnswer}
                  studentAnswer={a.studentAnswer}
                />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
