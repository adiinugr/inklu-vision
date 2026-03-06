import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("guru123", 12);

  await prisma.user.upsert({
    where: { email: "guru@inklu-vision.id" },
    update: {},
    create: {
      name: "Guru Demo",
      email: "guru@inklu-vision.id",
      password: hashedPassword,
    },
  });

  console.log("Seed berhasil: guru@inklu-vision.id / guru123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
