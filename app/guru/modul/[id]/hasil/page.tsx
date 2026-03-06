import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatTanggal } from "@/lib/utils";

export const metadata = {
  title: "Hasil Siswa — InkluVision",
};

export default async function HasilPage({
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
      results: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!mod || mod.authorId !== session.user.id) {
    notFound();
  }

  const avgScore =
    mod.results.length > 0
      ? Math.round(
          mod.results.reduce((sum, r) => sum + r.score, 0) / mod.results.length
        )
      : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Hasil Siswa</h1>
        <p className="mt-1 text-sm text-zinc-500">{mod.title}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-3xl font-bold text-zinc-900">{mod.results.length}</p>
          <p className="text-sm text-zinc-500">Total Siswa</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-zinc-900">
            {avgScore !== null ? avgScore : "—"}
          </p>
          <p className="text-sm text-zinc-500">Rata-rata Nilai</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-zinc-900">
            {mod.results.filter((r) => r.score >= 60).length}
          </p>
          <p className="text-sm text-zinc-500">Lulus (≥60)</p>
        </Card>
      </div>

      {mod.results.length === 0 ? (
        <Card>
          <p className="text-center text-zinc-500">
            Belum ada siswa yang mengerjakan evaluasi ini.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm" aria-label="Daftar hasil siswa">
            <thead>
              <tr className="border-b border-zinc-100 text-left">
                <th className="px-4 py-3 font-semibold text-zinc-700">Nama</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Kelas</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Nilai</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {mod.results.map((result) => (
                <tr
                  key={result.id}
                  className="border-b border-zinc-50 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {result.studentName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {result.studentClass}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        result.score >= 80
                          ? "success"
                          : result.score >= 60
                          ? "warning"
                          : "default"
                      }
                    >
                      {result.score}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatTanggal(result.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
