import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSafeLimit(value?: string) {
  const limit = Number(value);

  if (limit === 20) return 20;
  if (limit === 50) return 50;

  return 10;
}

function getModeInfo(mode?: string) {
  if (mode === "missed") {
    return {
      title: "Preguntas falladas",
      description:
        "Practicarás preguntas que respondiste mal al menos una vez. Es ideal para corregir errores previos.",
    };
  }

  if (mode === "red") {
    return {
      title: "Zona roja",
      description:
        "Practicarás preguntas que has fallado repetidamente. Son prioridad alta para reforzar aprendizaje.",
    };
  }

  if (mode === "due") {
    return {
      title: "Pendientes de repaso",
      description:
        "Practicarás preguntas cuyo repaso ya venció según tu repetición espaciada.",
    };
  }

  if (mode === "not-mastered") {
    return {
      title: "No dominadas",
      description:
        "Practicarás preguntas que todavía no están dominadas: nuevas, débiles o en aprendizaje.",
    };
  }

  return {
    title: "Práctica general",
    description:
      "Practicarás preguntas aleatorias de este banco. Es útil para mantener contacto constante con el tema.",
  };
}

function getLimitInfo(limit: number) {
  if (limit === 10) {
    return {
      title: "Práctica rápida",
      description:
        "Sesión corta para repasar sin cansarte. Ideal para usar varias veces al día.",
    };
  }

  if (limit === 20) {
    return {
      title: "Práctica normal",
      description:
        "Sesión intermedia para reforzar un banco o tema con más profundidad.",
    };
  }

  return {
    title: "Simulacro",
    description:
      "Sesión larga de 50 preguntas para entrenar resistencia y concentración.",
  };
}

export default async function PracticeStartPage({
  params,
  searchParams,
}: {
  params: Promise<{ bankId: string }>;
  searchParams: Promise<{
    limit?: string;
    mode?: string;
  }>;
}) {
  const { bankId } = await params;
  const query = await searchParams;

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const now = new Date();

  const limit = getSafeLimit(query.limit);
  const mode = query.mode || "all";

  const modeInfo = getModeInfo(mode);
  const limitInfo = getLimitInfo(limit);

  const bank = await prisma.questionBank.findUnique({
    where: {
      id: bankId,
    },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!bank) {
    notFound();
  }

  const availableQuestions = await prisma.question.count({
    where: {
      bankId,

      ...(mode === "missed"
        ? {
            answers: {
              some: {
                isCorrect: false,
                session: {
                  userId,
                },
              },
            },
          }
        : {}),

      ...(mode === "red"
        ? {
            progress: {
              some: {
                userId,
                status: "red",
              },
            },
          }
        : {}),

      ...(mode === "due"
        ? {
            progress: {
              some: {
                userId,
                nextReviewAt: {
                  lte: now,
                },
              },
            },
          }
        : {}),

      ...(mode === "not-mastered"
        ? {
            OR: [
              {
                progress: {
                  none: {
                    userId,
                  },
                },
              },
              {
                progress: {
                  some: {
                    userId,
                    status: {
                      not: "mastered",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
  });

  const realSessionSize = Math.min(limit, availableQuestions);

  const startHref =
    mode === "all"
      ? `/practice/${bank.id}?limit=${limit}`
      : `/practice/${bank.id}?mode=${mode}&limit=${limit}`;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Antes de empezar
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            {limitInfo.title}
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-700">
            {limitInfo.description}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Banco" value={bank.name} />
          <StatCard title="Solicitadas" value={String(limit)} />
          <StatCard title="Disponibles" value={String(availableQuestions)} />
        </section>

        {availableQuestions === 0 ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-red-950">
              No hay preguntas disponibles para este modo
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-800">
              Este banco tiene {bank._count.questions} preguntas en total, pero
              ninguna coincide con el modo seleccionado:{" "}
              <strong>{modeInfo.title}</strong>.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/practice"
                prefetch={false}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
              >
                Cambiar modo
              </Link>

              <Link
                href={`/practice/${bank.id}/start?limit=10`}
                prefetch={false}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
              >
                Usar práctica general
              </Link>
            </div>
          </section>
        ) : (
          <>
            {realSessionSize < limit && (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-amber-950">
                  Hay menos preguntas disponibles
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Solicitaste {limit} preguntas, pero este modo solo tiene{" "}
                  {availableQuestions} disponibles. La sesión usará hasta{" "}
                  <strong>{realSessionSize}</strong> preguntas.
                </p>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Modo seleccionado
              </h2>

              <p className="mt-2 text-lg font-semibold text-slate-900">
                {modeInfo.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {modeInfo.description}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Recomendación
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                Cada respuesta se guarda automáticamente al presionar{" "}
                <strong>Responder</strong>. Si sales antes de terminar, tu
                progreso no se pierde.
              </p>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={startHref}
                prefetch={false}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
              >
                Empezar práctica
              </Link>

              <Link
                href="/practice"
                prefetch={false}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
              >
                Cambiar modo
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
