import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Mic, Headphones, BookOpen, Eye } from "lucide-react";
import VoiceSearch from "@/components/siswa/VoiceSearch";
import SearchResultsGuide from "@/components/siswa/SearchResultsGuide";

interface SearchParams {
  q?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let searchResults = null;
  let recentModules = null;

  if (query) {
    searchResults = await prisma.module.findMany({
      where: {
        publishedAt: { not: null },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { accessCode: query.toUpperCase() },
        ],
      },
      include: {
        author: { select: { name: true } },
        _count: { select: { questions: true, results: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
  } else {
    recentModules = await prisma.module.findMany({
      where: { publishedAt: { not: null } },
      include: {
        author: { select: { name: true } },
        _count: { select: { questions: true, results: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4">

      {/* ── Page Header (always visible) ──────────────────────────── */}
      <header className="pt-8 pb-4 text-center">
        <span
          className="inline-flex items-center gap-1.5 mb-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: "#FF385C" }}
          aria-label="Platform inklusif untuk siswa tunanetra"
        >
          <Eye className="h-3 w-3" aria-hidden="true" />
          Dirancang untuk Siswa Tunanetra
        </span>
        <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 leading-tight">
          InkluVision
        </h1>
        <p className="mt-2 text-base text-zinc-500 max-w-xl mx-auto">
          Belajar dengan suara, tanpa perlu melihat layar
        </p>
      </header>

      {/* ── Search Section (TOP, prominent) ───────────────────────── */}
      <section
        id="cari-modul"
        aria-labelledby="search-heading"
        className="mb-10 rounded-3xl border border-zinc-100 bg-white shadow-lg p-6 lg:p-8"
      >
        <h2
          id="search-heading"
          className="mb-1 text-xl font-bold text-zinc-900"
        >
          Cari Modul atau Masukkan Kode Akses
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          Punya kode dari guru? Ketikkan langsung di sini. Atau ucapkan{" "}
          <strong className="text-zinc-700">&ldquo;Hi Vision&rdquo;</strong> untuk mencari dengan suara.
        </p>

        <form action="/" method="GET" role="search" aria-label="Cari modul">
          <div className="flex gap-3">
            <label htmlFor="search-input" className="sr-only">
              Cari modul atau masukkan kode akses
            </label>
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cari judul modul atau masukkan kode akses..."
              autoFocus={!query}
              className="min-h-[56px] flex-1 rounded-2xl border border-zinc-200 px-5 text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{ "--tw-ring-color": "#FF385C" } as React.CSSProperties}
              aria-label="Cari modul atau masukkan kode akses"
            />
            <button
              type="submit"
              className="min-h-[56px] rounded-2xl px-8 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "#FF385C" }}
            >
              Cari
            </button>
          </div>
        </form>

        {query ? (
          <SearchResultsGuide
            results={(searchResults ?? []).map((m) => ({ slug: m.slug, title: m.title }))}
            query={query}
          />
        ) : (
          <VoiceSearch />
        )}

        {/* Search results */}
        {query && searchResults !== null && (
          <div className="mt-8" aria-labelledby="results-heading">
            <h3
              id="results-heading"
              className="mb-4 text-base font-semibold text-zinc-700"
            >
              {searchResults.length === 0
                ? `Tidak ada hasil untuk "${query}"`
                : `${searchResults.length} hasil untuk "${query}"`}
            </h3>

            {searchResults.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center">
                <p className="text-zinc-500">
                  Tidak ada modul yang ditemukan. Pastikan kode akses atau
                  judul yang kamu masukkan sudah benar.
                </p>
              </div>
            ) : (
              <ul
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                role="list"
              >
                {searchResults.map((mod) => (
                  <li key={mod.id}>
                    <ModulePublicCard
                      slug={mod.slug}
                      title={mod.title}
                      description={mod.description}
                      authorName={mod.author.name}
                      questionCount={mod._count.questions}
                      resultCount={mod._count.results}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* ── Accessibility Capabilities (homepage only) ────────────── */}
      {!query && (
        <section aria-labelledby="inklusif-heading" className="mb-10">
          <h2
            id="inklusif-heading"
            className="mb-5 text-xl font-bold text-zinc-900"
          >
            Sepenuhnya Inklusif untuk Siswa Tunanetra
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-50 rounded-2xl p-5 flex flex-col gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FF385C" }}
                aria-hidden="true"
              >
                <Mic className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-zinc-900">Pencarian Suara</p>
              <p className="text-sm text-zinc-500">
                Ucapkan <strong className="text-zinc-700">&ldquo;Hi Vision&rdquo;</strong> lalu nama modul — tanpa menyentuh layar.
              </p>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-5 flex flex-col gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FF385C" }}
                aria-hidden="true"
              >
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-zinc-900">Mode Audio Penuh</p>
              <p className="text-sm text-zinc-500">
                Semua materi dibacakan otomatis. Navigasi dengan tombol Space, anak panah, dan perintah suara.
              </p>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-5 flex flex-col gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FF385C" }}
                aria-hidden="true"
              >
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-zinc-900">Kompatibel Screen Reader</p>
              <p className="text-sm text-zinc-500">
                Dibangun dengan HTML semantik dan label ARIA — bekerja sempurna dengan NVDA, JAWS, dan VoiceOver.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Cara Pakai (homepage only) ────────────────────────────── */}
      {!query && (
        <section aria-labelledby="cara-pakai-heading" className="mb-10">
          <h2 id="cara-pakai-heading" className="mb-5 text-xl font-bold text-zinc-900">
            Cara Menggunakan InkluVision
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Cari Modul", desc: 'Ketik judul, kode akses, atau ucapkan "Hi Vision" lalu nama modul' },
              { step: "2", title: "Dengarkan & Baca", desc: 'Tekan "Baca" untuk mendengarkan materi secara otomatis' },
              { step: "3", title: "Kerjakan Evaluasi", desc: "Jawab soal dengan suara atau tombol, dan dapatkan skor dari AI" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
                <span
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: "#FF385C" }}
                  aria-hidden="true"
                >
                  {step}
                </span>
                <p className="font-bold text-zinc-900">{title}</p>
                <p className="mt-1 text-sm text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Latest Modules (only when no query) ──────────────────── */}
      {!query && recentModules !== null && (
        <section aria-labelledby="terbaru-heading" className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <h2
              id="terbaru-heading"
              className="text-2xl font-bold text-zinc-900"
            >
              Materi Terbaru
            </h2>
            <div
              className="h-1 w-10 rounded-full"
              style={{ backgroundColor: "#FF385C" }}
              aria-hidden="true"
            />
          </div>

          {recentModules.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
              <p className="text-zinc-500">
                Belum ada modul yang dipublikasikan. Pantau terus!
              </p>
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
            >
              {recentModules.map((mod) => (
                <li key={mod.id}>
                  <ModulePublicCard
                    slug={mod.slug}
                    title={mod.title}
                    description={mod.description}
                    authorName={mod.author.name}
                    questionCount={mod._count.questions}
                    resultCount={mod._count.results}

                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

    </div>
  );
}

// ── Module Card Component ─────────────────────────────────────────────────────

interface ModulePublicCardProps {
  slug: string;
  title: string;
  description: string | null;
  authorName: string;
  questionCount: number;
  resultCount: number;
}

function ModulePublicCard({
  slug,
  title,
  description,
  authorName,
  questionCount,
  resultCount,
}: ModulePublicCardProps) {
  return (
    <Link
      href={`/modul/${slug}`}
      aria-label={`Buka modul: ${title}`}
      className="block h-full rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {/* Top accent strip */}
      <div
        className="h-1.5 rounded-t-2xl"
        style={{ backgroundColor: "#FF385C" }}
        aria-hidden="true"
      />

      <div className="p-5">
        {/* Title */}
        <p className="font-bold text-zinc-900 text-base line-clamp-2">
          {title}
        </p>

        {/* Description */}
        {description && (
          <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
            {description}
          </p>
        )}

        {/* Author */}
        <p className="mt-2 text-xs text-zinc-400">oleh {authorName}</p>

        {/* Divider + stats */}
        <div className="mt-4 border-t border-zinc-100 pt-3 flex items-center gap-3">
          <span className="text-xs text-zinc-500">{questionCount} soal</span>
          {resultCount > 0 && (
            <>
              <span className="text-zinc-200" aria-hidden="true">|</span>
              <span className="text-xs text-zinc-500">{resultCount} siswa</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
