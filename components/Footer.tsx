import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="mb-2 text-lg font-bold">InkluVision</p>
            <p className="text-sm text-zinc-400">
              Platform belajar inklusif untuk semua siswa, tanpa batas.
            </p>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-3 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Platform
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#cari-modul"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cari Modul
                </Link>
              </li>
              <li>
                <Link
                  href="/#cara-pakai"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cara Pakai
                </Link>
              </li>
            </ul>
          </div>

          {/* Untuk Guru */}
          <div>
            <p className="mb-3 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Untuk Guru
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/guru/login"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Masuk Guru
                </Link>
              </li>
              <li>
                <Link
                  href="/guru/dashboard"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Dasbor Guru
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-500">
            &copy; 2026 InkluVision. Dibuat untuk pembelajaran inklusif.
          </p>
        </div>
      </div>
    </footer>
  );
}
