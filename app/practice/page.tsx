import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PracticePage() {
  const banks = await prisma.questionBank.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            PrÃ¡ctica
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Elige cÃ³mo quieres practicar
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            Banki estÃ¡ diseÃ±ado para sesiones cortas y constantes. Puedes hacer
            10 preguntas rÃ¡pidas, 20 preguntas normales o un simulacro de 50
            preguntas cuando tengas mÃ¡s tiempo.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="10 preguntas"
            subtitle="PrÃ¡ctica rÃ¡pida"
            description="Ideal para repasar durante el dÃ­a sin cansarte. Ãšsalo cuando tengas poco tiempo."
          />

          <InfoCard
            title="20 preguntas"
            subtitle="PrÃ¡ctica normal"
            description="Buena sesiÃ³n para reforzar un tema, banco o curso con mÃ¡s profundidad."
          />

          <InfoCard
            title="50 preguntas"
            subtitle="Simulacro"
            description="Modo largo para entrenar resistencia, concentraciÃ³n y manejo de tiempo."
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Modos inteligentes
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            Estos modos usan tu historial para priorizar lo que mÃ¡s necesitas
            repasar.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <ModeInfoCard
              title="Falladas"
              description="Preguntas que respondiste mal al menos una vez."
            />

            <ModeInfoCard
              title="Zona roja"
              description="Preguntas que has fallado repetidamente."
            />

            <ModeInfoCard
              title="Pendientes"
              description="Preguntas cuyo repaso ya toca segÃºn repeticiÃ³n espaciada."
            />

            <ModeInfoCard
              title="No dominadas"
              description="Preguntas nuevas, dÃ©biles o en aprendizaje."
            />
          </div>
        </section>

        {banks.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              No hay bancos disponibles
            </h2>

            <p className="mt-2 text-slate-700">
              Primero crea un banco o importa preguntas desde CSV.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/banks/new"
                className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
              >
                Crear banco
              </Link>

              <Link
                href="/import"
                className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
              >
                Importar CSV
              </Link>
            </div>
          </section>
        ) : (
          <section className="space-y-5">
            {banks.map((bank) => (
              <article
                key={bank.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Banco
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-slate-950">
                      {bank.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {bank.subject || "Sin categorÃ­a"} Â·{" "}
                      {bank._count.questions}{" "}
                      {bank._count.questions === 1 ? "pregunta" : "preguntas"}
                    </p>
                  </div>

                  <Link
                    href={`/banks/${bank.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
                  >
                    Gestionar banco
                  </Link>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">
                    Sesiones por cantidad
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <PracticeButton
                      href={`/practice/${bank.id}/start?limit=10`}
                      title="PrÃ¡ctica rÃ¡pida"
                      description="10 preguntas"
                    />

                    <PracticeButton
                      href={`/practice/${bank.id}/start?limit=20`}
                      title="PrÃ¡ctica normal"
                      description="20 preguntas"
                    />

                    <PracticeButton
                      href={`/practice/${bank.id}/start?limit=50`}
                      title="Simulacro"
                      description="50 preguntas"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">
                    Sesiones inteligentes
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <PracticeButton
                      href={`/practice/${bank.id}/start?mode=missed&limit=10`}
                      title="Falladas"
                      description="Errores previos"
                    />

                    <PracticeButton
                      href={`/practice/${bank.id}/start?mode=red&limit=10`}
                      title="Zona roja"
                      description="Prioridad alta"
                    />

                    <PracticeButton
                      href={`/practice/${bank.id}/start?mode=due&limit=10`}
                      title="Pendientes"
                      description="Repaso vencido"
                    />

                    <PracticeButton
                      href={`/practice/${bank.id}/start?mode=not-mastered&limit=10`}
                      title="No dominadas"
                      description="AÃºn en aprendizaje"
                    />
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}

function ModeInfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}

function PracticeButton({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
    >
      <p className="text-sm font-bold text-slate-950 group-hover:text-black">
        {title}
      </p>

      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  );
}

