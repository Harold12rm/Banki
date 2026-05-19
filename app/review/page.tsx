import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ReviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const now = new Date();

  const progress = await prisma.questionProgress.findMany({
    where: {
      userId,
    },
    include: {
      question: {
        include: {
          bank: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const banks = await prisma.questionBank.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      subject: true,
    },
  });

  const topics = Array.from(
    new Set(progress.map((item) => item.question.topic).filter(Boolean))
  ).sort();

  const dueCount = progress.filter(
    (item) => item.nextReviewAt && item.nextReviewAt <= now
  ).length;

  const redCount = progress.filter((item) => item.status === "red").length;

  const learningCount = progress.filter(
    (item) => item.status === "learning"
  ).length;

  const reviewingCount = progress.filter(
    (item) => item.status === "reviewing"
  ).length;

  const almostMasteredCount = progress.filter(
    (item) => item.status === "almost_mastered"
  ).length;

  const masteredCount = progress.filter(
    (item) => item.status === "mastered"
  ).length;

  const notMasteredCount = progress.filter(
    (item) => item.status !== "mastered"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            RepeticiÃ³n espaciada
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Centro de repaso
          </h1>

          <p className="mt-2 max-w-3xl text-base text-slate-700">
            Banki prioriza lo que debes volver a ver: preguntas pendientes,
            falladas repetidamente y preguntas aÃºn no dominadas.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Pendientes hoy" value={dueCount} />
          <StatCard title="Zona roja" value={redCount} />
          <StatCard title="No dominadas" value={notMasteredCount} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Aprendiendo" value={learningCount} />
          <StatCard title="En repaso" value={reviewingCount} />
          <StatCard title="Casi dominadas" value={almostMasteredCount} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Dominadas" value={masteredCount} />
          <StatCard title="Con progreso" value={progress.length} />
          <StatCard title="Bancos disponibles" value={banks.length} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Iniciar repaso rÃ¡pido
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            RecomendaciÃ³n: usa 10 preguntas para sesiones cortas. Usa 20 cuando
            tengas mÃ¡s tiempo. El simulacro de 50 es para sesiones largas.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <ReviewButton href="/review/session?mode=due&limit=10">
              10 pendientes
            </ReviewButton>

            <ReviewButton href="/review/session?mode=red&limit=10">
              10 zona roja
            </ReviewButton>

            <ReviewButton href="/review/session?mode=not-mastered&limit=10">
              10 no dominadas
            </ReviewButton>

            <ReviewButton href="/review/session?mode=due&limit=20">
              20 pendientes
            </ReviewButton>

            <ReviewButton href="/review/session?mode=learning&limit=20">
              20 aprendiendo
            </ReviewButton>

            <ReviewButton href="/review/session?mode=not-mastered&limit=50">
              Simulacro 50 no dominadas
            </ReviewButton>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Crear repaso personalizado
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            Filtra por banco, tema, dificultad y tipo de repaso.
          </p>

          <form action="/review/session" className="mt-5 grid gap-3 md:grid-cols-5">
            <select
              name="mode"
              defaultValue="due"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="due">Pendientes de repaso</option>
              <option value="red">Zona roja</option>
              <option value="learning">Aprendiendo</option>
              <option value="not-mastered">No dominadas</option>
              <option value="all">Todas con progreso</option>
            </select>

            <select
              name="bankId"
              defaultValue=""
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="">Todos los bancos</option>

              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                  {bank.subject ? ` Â· ${bank.subject}` : ""}
                </option>
              ))}
            </select>

            <select
              name="topic"
              defaultValue=""
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="">Todos los temas</option>

              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <select
              name="difficulty"
              defaultValue=""
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="">Todas las dificultades</option>
              <option value="easy">FÃ¡cil</option>
              <option value="medium">Media</option>
              <option value="hard">DifÃ­cil</option>
            </select>

            <select
              name="limit"
              defaultValue="10"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="10">10 preguntas</option>
              <option value="20">20 preguntas</option>
              <option value="50">50 preguntas</option>
            </select>

            <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 md:col-span-5">
              Iniciar repaso personalizado
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            QuÃ© significa cada modo
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoCard
              title="Pendientes de repaso"
              description="Preguntas cuyo prÃ³ximo repaso ya venciÃ³. Son la prioridad del dÃ­a."
            />

            <InfoCard
              title="Zona roja"
              description="Preguntas falladas repetidamente. Deben reaparecer pronto para corregir el error."
            />

            <InfoCard
              title="Aprendiendo"
              description="Preguntas que todavÃ­a no tienen suficientes aciertos espaciados para considerarse dominadas."
            />

            <InfoCard
              title="No dominadas"
              description="Incluye preguntas nuevas, falladas, en aprendizaje o en repaso. Excluye las dominadas."
            />

            <InfoCard
              title="Casi dominadas"
              description="Preguntas con buena racha, pero que necesitan confirmaciÃ³n en dÃ­as distintos."
            />

            <InfoCard
              title="Dominadas"
              description="Preguntas respondidas correctamente varias veces en dÃ­as distintos. Si las fallas otra vez, bajan de nivel."
            />
          </div>
        </section>

        {progress.length === 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              AÃºn no hay historial de repaso
            </h2>

            <p className="mt-2 text-slate-700">
              Practica un banco y responde algunas preguntas. Banki empezarÃ¡ a
              programar tus repasos automÃ¡ticamente.
            </p>

            <Link
              href="/practice"
              className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Ir a practicar
            </Link>
          </section>
        )}
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

function ReviewButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}
