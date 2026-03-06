import Link from "next/link";
import { formatTanggal } from "@/lib/utils";
import { FileText, Users, ExternalLink } from "lucide-react";

interface ModuleCardProps {
  id: string;
  title: string;
  slug: string;
  accessCode: string;
  publishedAt: Date | null;
  questionCount: number;
  studentCount: number;
  createdAt: Date;
}

export default function ModuleCard({
  id,
  title,
  slug,
  accessCode,
  publishedAt,
  questionCount,
  studentCount,
  createdAt,
}: ModuleCardProps) {
  const isPublished = !!publishedAt;

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Top accent strip */}
      <div
        className="h-1.5 rounded-t-2xl"
        style={{ backgroundColor: isPublished ? "#FF385C" : "#d4d4d8" }}
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-base font-bold text-zinc-900 line-clamp-2">
              {title}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Dibuat {formatTanggal(createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isPublished
                ? "bg-emerald-50 text-emerald-700"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {isPublished ? "Publik" : "Draf"}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {questionCount} soal
          </span>
          <span className="text-zinc-200" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {studentCount} siswa
          </span>
        </div>

        {/* Access code */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Kode akses:</span>
          <span className="rounded-lg bg-zinc-50 px-2.5 py-1 font-mono text-sm font-semibold tracking-widest text-zinc-700 border border-zinc-200">
            {accessCode}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
          <Link
            href={`/guru/modul/${id}/edit`}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ backgroundColor: "#FF385C" }}
            aria-label={`Edit modul ${title}`}
          >
            Edit
          </Link>
          <Link
            href={`/guru/modul/${id}/hasil`}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            aria-label={`Lihat hasil modul ${title}`}
          >
            Hasil
          </Link>
          <Link
            href={`/modul/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            aria-label={`Buka modul ${title} sebagai siswa`}
          >
            <span className="flex items-center gap-1.5">
            Lihat Modul
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
