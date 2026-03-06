import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ModuleCard from "@/components/guru/ModuleCard";
import { Package, CheckCircle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata = {
  title: "Dasbor Guru — InkluVision",
};

export default async function DashboardPage() {
  const session = await auth();

  const modules = await prisma.module.findMany({
    where: { authorId: session!.user!.id! },
    include: {
      _count: {
        select: { questions: true, results: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSiswa = modules.reduce((sum, m) => sum + m._count.results, 0);
  const totalPublished = modules.filter((m) => m.publishedAt).length;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dasbor Guru</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Selamat datang,{" "}
            <span className="font-semibold text-zinc-700">
              {session?.user?.name}
            </span>
          </p>
        </div>
        <Link
          href="/guru/modul/buat"
          className="inline-flex min-h-[44px] items-center rounded-2xl px-6 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ backgroundColor: "#FF385C" }}
        >
          + Buat Modul Baru
        </Link>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Modul"
          value={modules.length}
          Icon={Package}
          accent="#FF385C"
        />
        <StatCard
          label="Dipublikasikan"
          value={totalPublished}
          Icon={CheckCircle}
          accent="#10b981"
        />
        <StatCard
          label="Total Siswa"
          value={totalSiswa}
          Icon={Users}
          accent="#6366f1"
        />
      </div>

      {/* Module list */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-bold text-zinc-900">Modul Saya</h2>
        <div
          className="h-1 w-8 rounded-full"
          style={{ backgroundColor: "#FF385C" }}
          aria-hidden="true"
        />
      </div>

      {modules.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-14 text-center">
          <p className="mb-2 text-zinc-500">Belum ada modul.</p>
          <p className="mb-6 text-sm text-zinc-400">
            Mulai buat modul pertamamu untuk para siswa.
          </p>
          <Link
            href="/guru/modul/buat"
            className="inline-flex min-h-[44px] items-center rounded-2xl px-6 text-sm font-semibold text-white"
            style={{ backgroundColor: "#FF385C" }}
          >
            Buat Modul Pertama
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2" role="list">
          {modules.map((mod) => (
            <li key={mod.id}>
              <ModuleCard
                id={mod.id}
                title={mod.title}
                slug={mod.slug}
                accessCode={mod.accessCode}
                publishedAt={mod.publishedAt}
                questionCount={mod._count.questions}
                studentCount={mod._count.results}
                createdAt={mod.createdAt}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">{label}</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}18` }}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </span>
      </div>
      <p className="text-3xl font-bold text-zinc-900">{value}</p>
      <div
        className="mt-3 h-1 w-10 rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
    </div>
  );
}
