import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Navbar() {
  const session = await auth();
  const userName = session?.user?.name ?? "";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="text-lg font-bold text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          InkluVision
        </Link>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              {/* Avatar + name → links to dashboard */}
              <Link
                href="/guru/dashboard"
                className="flex items-center gap-2.5 rounded-2xl px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                aria-label={`Dasbor Guru — ${userName}`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: "#FF385C" }}
                  aria-hidden="true"
                >
                  {initial}
                </span>
                <span className="hidden sm:inline font-medium">{userName}</span>
              </Link>

              {/* Sign out */}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-2xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/guru/login"
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              style={{ backgroundColor: "#FF385C" }}
            >
              Masuk sebagai Guru
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
