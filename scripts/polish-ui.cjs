const fs = require("fs");
const path = require("path");

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log("Actualizado:", file);
}

function patchGlobals() {
  const file = "app/globals.css";

  if (!fs.existsSync(file)) {
    console.log("No existe app/globals.css");
    return;
  }

  let content = fs.readFileSync(file, "utf8");

  const darkBlock = `
/* Banki dark mode */
html.dark {
  background: #020617;
}

html.dark body {
  background: #020617;
  color: #e2e8f0;
}

html.dark .bg-white {
  background-color: #0f172a !important;
}

html.dark .bg-slate-100 {
  background-color: #020617 !important;
}

html.dark .bg-slate-50 {
  background-color: #111827 !important;
}

html.dark .text-slate-950 {
  color: #f8fafc !important;
}

html.dark .text-slate-900 {
  color: #f1f5f9 !important;
}

html.dark .text-slate-800 {
  color: #e2e8f0 !important;
}

html.dark .text-slate-700 {
  color: #cbd5e1 !important;
}

html.dark .text-slate-600,
html.dark .text-slate-500 {
  color: #94a3b8 !important;
}

html.dark .border-slate-200,
html.dark .border-slate-300 {
  border-color: #334155 !important;
}

html.dark .ring-slate-200 {
  --tw-ring-color: #334155 !important;
}

html.dark input,
html.dark textarea,
html.dark select {
  background-color: #0f172a !important;
  color: #f8fafc !important;
  border-color: #334155 !important;
}

html.dark ::placeholder {
  color: #64748b !important;
}
`;

  if (!content.includes("/* Banki dark mode */")) {
    content = content + "\n" + darkBlock;
    fs.writeFileSync(file, content, "utf8");
    console.log("Actualizado:", file);
  } else {
    console.log("Dark mode ya existe en:", file);
  }
}

write("components/ThemeToggle.tsx", `"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("banki-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleTheme() {
    const nextValue = !isDark;

    setIsDark(nextValue);
    document.documentElement.classList.toggle("dark", nextValue);
    window.localStorage.setItem("banki-theme", nextValue ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
      aria-label="Cambiar tema"
    >
      {isDark ? "Claro" : "Oscuro"}
    </button>
  );
}
`);

write("components/Navbar.tsx", `import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Navbar() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black tracking-tight text-slate-950">
            Banki
          </Link>

          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
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

          <span className="hidden h-5 w-px bg-slate-200 lg:inline-block" />

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

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

write("app/page.tsx", `import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-10">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Aprende con repetición espaciada
              </p>

              <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950 md:text-6xl">
                Banki convierte tus preguntas en aprendizaje real.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Practica sesiones cortas, detecta tus preguntas débiles, repasa
                cuando toca y mide tu progreso por banco, tema y dificultad.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50"
                >
                  {user ? "Ir a mi panel" : "Crear cuenta"}
                </Link>

                <Link
                  href={user ? "/practice" : "/login"}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-white"
                >
                  {user ? "Practicar ahora" : "Iniciar sesión"}
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <div className="grid gap-4">
                <FeatureCard
                  title="Sesiones cortas"
                  description="Practica 10, 20 o simulacros de 50 preguntas."
                />

                <FeatureCard
                  title="Repetición espaciada"
                  description="Banki prioriza pendientes, zona roja y no dominadas."
                />

                <FeatureCard
                  title="Estadísticas útiles"
                  description="Mide rendimiento por banco, tema, dificultad y actividad."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MiniCard
            title="Importa CSV"
            description="Carga bancos desde Google Sheets o Excel con vista previa."
          />

          <MiniCard
            title="Repasa inteligente"
            description="Vuelve sobre lo que fallaste en el momento adecuado."
          />

          <MiniCard
            title="Administra bancos"
            description="Edita preguntas, opciones, explicaciones y temas."
          />
        </section>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}

function MiniCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}
`);

write("app/dashboard/page.tsx", `export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const now = new Date();

  const [answersCount, dueCount, redCount, masteredCount, banksCount] =
    await Promise.all([
      prisma.sessionAnswer.count({
        where: {
          session: {
            userId,
          },
        },
      }),
      prisma.questionProgress.count({
        where: {
          userId,
          nextReviewAt: {
            lte: now,
          },
        },
      }),
      prisma.questionProgress.count({
        where: {
          userId,
          status: "red",
        },
      }),
      prisma.questionProgress.count({
        where: {
          userId,
          status: "mastered",
        },
      }),
      prisma.questionBank.count(),
    ]);

  const continueHref =
    dueCount > 0
      ? "/review/session?mode=due&limit=10"
      : redCount > 0
        ? "/review/session?mode=red&limit=10"
        : "/practice";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Bienvenido
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Continúa tu aprendizaje
          </h1>

          <p className="mt-2 max-w-3xl text-slate-700">
            Hola {user.email}. Aquí tienes un resumen rápido de tu progreso y el
            mejor siguiente paso para estudiar.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={continueHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Continuar repasando
            </Link>

            <Link
              href="/practice"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-white"
            >
              Elegir práctica
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-5">
          <StatCard title="Respondidas" value={answersCount} />
          <StatCard title="Pendientes" value={dueCount} />
          <StatCard title="Zona roja" value={redCount} />
          <StatCard title="Dominadas" value={masteredCount} />
          <StatCard title="Bancos" value={banksCount} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Repaso"
            description="Vuelve a las preguntas que ya toca revisar."
            href="/review"
          />

          <ActionCard
            title="Estadísticas"
            description="Mira tu rendimiento por banco, tema y dificultad."
            href="/stats"
          />

          <ActionCard
            title="Bancos"
            description="Explora bancos disponibles y empieza una sesión."
            href="/banks"
          />
        </section>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </Link>
  );
}
`);

write("app/login/page.tsx", `import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=Correo%20y%20contraseña%20son%20obligatorios.");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message =
      error.message === "Email not confirmed"
        ? "Debes confirmar tu correo o desactivar Confirm email en Supabase para desarrollo."
        : error.message;

    redirect("/login?error=" + encodeURIComponent(message));
  }

  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-md space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Banki
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Iniciar sesión
          </h1>

          <p className="mt-2 text-slate-700">
            Accede para guardar tu progreso, estadísticas y repetición espaciada.
          </p>
        </header>

        {params.message && (
          <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            {params.message}
          </p>
        )}

        {params.error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {params.error}
          </p>
        )}

        <form
          action={login}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Correo
            </label>

            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Contraseña
            </label>

            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <button className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50">
            Entrar
          </button>

          <p className="text-center text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="font-semibold text-slate-950">
              Crear cuenta
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
`);

write("app/signup/page.tsx", `import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signup(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/signup?error=Correo%20y%20contraseña%20son%20obligatorios.");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  if (data.user) {
    await prisma.profile.upsert({
      where: {
        id: data.user.id,
      },
      update: {
        email,
      },
      create: {
        id: data.user.id,
        email,
      },
    });
  }

  redirect("/dashboard");
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-md space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Banki
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Crear cuenta
          </h1>

          <p className="mt-2 text-slate-700">
            Crea una cuenta para guardar tu progreso personal.
          </p>
        </header>

        {params.error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {params.error}
          </p>
        )}

        <form
          action={signup}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Correo
            </label>

            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Contraseña
            </label>

            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <button className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50">
            Crear cuenta
          </button>

          <p className="text-center text-sm text-slate-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-slate-950">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
`);

patchGlobals();

console.log("");
console.log("Listo. Ejecuta ahora:");
console.log("npm run dev");
