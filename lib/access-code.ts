import { prisma } from "@/lib/prisma";

export async function generateUniqueAccessCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  while (true) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await prisma.module.findUnique({
      where: { accessCode: code },
    });

    if (!existing) return code;
  }
}
