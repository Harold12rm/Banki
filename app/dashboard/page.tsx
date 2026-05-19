export const dynamic = "force-dynamic";
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
