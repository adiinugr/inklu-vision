import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/guru/login");

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
