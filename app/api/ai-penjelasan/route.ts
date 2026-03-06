import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionText, correctAnswer, studentAnswer } = body;

    if (!questionText || !correctAnswer || !studentAnswer) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah tutor yang ramah dan sabar. Jelaskan dengan bahasa Indonesia yang sederhana dan mudah dipahami oleh siswa. Berikan penjelasan yang membantu siswa memahami mengapa jawaban yang benar itu benar, tanpa menghakimi kesalahan siswa.",
        },
        {
          role: "user",
          content: `Soal: ${questionText}\n\nJawaban benar: ${correctAnswer}\n\nJawaban siswa: ${studentAnswer}\n\nTolong jelaskan mengapa jawaban yang benar itu benar dan bantu siswa memahami konsepnya.`,
        },
      ],
    });

    const penjelasan = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ penjelasan });
  } catch (error) {
    console.error("AI penjelasan error:", error);
    return NextResponse.json(
      { error: "Gagal mendapatkan penjelasan dari AI" },
      { status: 500 }
    );
  }
}
