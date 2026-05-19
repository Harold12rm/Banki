const fs = require("fs");
const path = require("path");

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log("Actualizado:", file);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function exists(file) {
  return fs.existsSync(file);
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;

  const importBlock = content.match(/^(import .+?;\r?\n)+/m);

  if (importBlock) {
    return content.replace(importBlock[0], importBlock[0] + importLine + "\n");
  }

  return importLine + "\n" + content;
}

function protectDefaultPage(content) {
  if (content.includes("await requireAdmin();")) return content;

  content = ensureImport(content, 'import { requireAdmin } from "@/lib/auth";');

  content = content.replace(
    /export default function ([A-Za-z0-9_]+)\(/,
    "export default async function $1("
  );

  content = content.replace(
    /export default async function ([A-Za-z0-9_]+)\(([^)]*)\)\s*\{/,
    (match) => `${match}\n  await requireAdmin();\n`
  );

  return content;
}

function protectFile(file) {
  if (!exists(file)) {
    console.log("No existe, omitido:", file);
    return;
  }

  const original = read(file);
  const updated = protectDefaultPage(original);

  if (original !== updated) {
    write(file, updated);
  } else {
    console.log("Sin cambios:", file);
  }
}

/* 1. Crear lib/auth.ts */
write("lib/auth.ts", `import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await prisma.profile.upsert({
    where: {
      id: user.id,
    },
    update: {
      email: user.email || "",
    },
    create: {
      id: user.id,
      email: user.email || "",
      role: "user",
    },
  });

  return profile;
}

export async function requireAdmin() {
  const user = await requireUser();

  const profile = await prisma.profile.upsert({
    where: {
      id: user.id,
    },
    update: {
      email: user.email || "",
    },
    create: {
      id: user.id,
      email: user.email || "",
      role: "user",
    },
  });

  if (profile.role !== "admin") {
    redirect("/unauthorized");
  }

  return profile;
}
`);

/* 2. Crear página unauthorized */
write("app/unauthorized/page.tsx", `import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Acceso restringido
        </p>

        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
          No tienes permisos de administrador
        </h1>

        <p className="mt-3 text-slate-700">
          Esta sección está reservada para administrar bancos, preguntas e importaciones.
        </p>

        <Link
          href="/practice"
          className="mt-6 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
        >
          Ir a practicar
        </Link>
      </section>
    </main>
  );
}
`);

/* 3. Proteger páginas admin */
const adminPages = [
  "app/import/page.tsx",
  "app/banks/new/page.tsx",
  "app/banks/[bankId]/edit/page.tsx",
  "app/banks/[bankId]/questions/new/page.tsx",
  "app/banks/[bankId]/questions/[questionId]/edit/page.tsx",
];

for (const file of adminPages) {
  protectFile(file);
}

/* 4. Reemplazar Navbar completo con versión por rol */
write("components/Navbar.tsx", `import Link from "next/link";
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
`);

console.log("");
console.log("Listo. Rutas admin protegidas y Navbar actualizado.");
console.log("");
console.log("Ahora revisa con:");
console.log("Select-String -Path .\\app\\**\\*.tsx -Pattern \"requireAdmin\"");
