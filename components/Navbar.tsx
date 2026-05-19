import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Navbar() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            Banki
          </Link>

          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          <NavLink href="/banks">Bancos</NavLink>
          <NavLink href="/practice">Practicar</NavLink>
          <NavLink href="/review">Repaso</NavLink>
          <NavLink href="/stats">Estadísticas</NavLink>
          <NavLink href="/missed">Falladas</NavLink>

          {isAdmin && <NavLink href="/import">Importar</NavLink>}

          {isAdmin && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Admin
            </span>
          )}

          <span className="hidden h-5 w-px bg-slate-200 dark:bg-slate-800 lg:inline-block" />

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {user ? (
            <>
              <span className="max-w-[190px] truncate rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {user.email}
              </span>

              <Link
                href="/logout"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Salir
              </Link>
            </>
          ) : (
            <>
              <NavLink href="/login">Login</NavLink>

              <Link
                href="/signup"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-2 py-1.5 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}
