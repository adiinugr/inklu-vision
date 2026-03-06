import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ModuleForm from "@/components/guru/ModuleForm";
import { createModule } from "@/lib/actions/module";

export const metadata = {
  title: "Buat Modul Baru — InkluVision",
};

export default function BuatModulPage() {
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

        <h1 className="text-2xl font-bold text-zinc-900">Buat Modul Baru</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Isi informasi modul, tulis materi dengan dukungan LaTeX, lalu tambahkan soal-soal.
        </p>
      </div>

      <ModuleForm onSubmit={createModule} submitLabel="Buat Modul" />
    </div>
  );
}
