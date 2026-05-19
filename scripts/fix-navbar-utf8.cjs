const fs = require("fs");

const content = `import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export default async function Navbar() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-xl font-bold text-slate-950">
          Banki
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/banks" className="hover:text-slate-950">
            Bancos
          </Link>

          <Link href="/practice" className="hover:text-slate-950">
            Practicar
          </Link>

          <Link href="/review" className="hover:text-slate-950">
            Repaso
          </Link>

          <Link href="/stats" className="hover:text-slate-950">
            Estadísticas
          </Link>

          <Link href="/missed" className="hover:text-slate-950">
            Falladas
          </Link>

          {isAdmin && (
            <Link href="/import" className="hover:text-slate-950">
              Importar
            </Link>
          )}

          {isAdmin && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              Admin
            </span>
          )}

          <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" />

          {user ? (
            <>
              <span className="max-w-[180px] truncate text-slate-500">
                {user.email}
              </span>

              <Link
                href="/logout"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-950 shadow-sm transition hover:bg-slate-50"
              >
                Salir
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-slate-950">
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-950 shadow-sm transition hover:bg-slate-50"
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
`;

fs.writeFileSync("components/Navbar.tsx", content, "utf8");
console.log("Navbar corregido en UTF-8");
