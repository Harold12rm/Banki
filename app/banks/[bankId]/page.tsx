import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { getCurrentProfile } from "@/lib/auth";

async function deleteBank(bankId: string) {
  "use server";

  const questions = await prisma.question.findMany({
    where: {
      bankId,
    },
    select: {
      id: true,
    },
  });

  const questionIds = questions.map((question: { id: string }) => question.id);

  await prisma.sessionAnswer.deleteMany({
    where: {
      questionId: {
        in: questionIds,
      },
    },
  });

  await prisma.markedQuestion.deleteMany({
    where: {
      questionId: {
        in: questionIds,
      },
    },
  });

  await prisma.questionProgress.deleteMany({
    where: {
      questionId: {
        in: questionIds,
      },
    },
  });

  await prisma.answerOption.deleteMany({
    where: {
      questionId: {
        in: questionIds,
      },
    },
  });

  await prisma.question.deleteMany({
    where: {
      bankId,
    },
  });

  await prisma.practiceSession.deleteMany({
    where: {
      bankId,
    },
  });

  await prisma.questionBank.delete({
    where: {
      id: bankId,
    },
  });

  redirect("/banks");
}

export default async function BankDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bankId: string }>;
  searchParams: Promise<{
    q?: string;
    topic?: string;
    difficulty?: string;
  }>;
}) {
  const { bankId } = await params;
  const filters = await searchParams;

  const q = filters.q || "";
  const topic = filters.topic || "";
  const difficulty = filters.difficulty || "";

  const bank = await prisma.questionBank.findUnique({
    where: {
      id: bankId,
    },
  });

  if (!bank) {
    notFound();
  }

  const allQuestions = await prisma.question.findMany({
    where: {
      bankId,
    },
    select: {
      id: true,
      topic: true,
      difficulty: true,
    },
  });

  const questions = await prisma.question.findMany({
    where: {
      bankId,

      ...(q
        ? {
            OR: [
              {
                prompt: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                explanation: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),

      ...(topic
        ? {
            topic: {
              contains: topic,
              mode: "insensitive",
            },
          }
        : {}),

      ...(difficulty
        ? {
            difficulty,
          }
        : {}),
    },
    include: {
      options: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const topics = Array.from(
    new Set(allQuestions.map((question: { topic: string }) => question.topic).filter(Boolean))
  ).sort();

  const easyCount = allQuestions.filter(
    (question: { id: string; topic: string; difficulty: string }) => question.difficulty === "easy"
  ).length;

  const mediumCount = allQuestions.filter(
    (question: { id: string; topic: string; difficulty: string }) => question.difficulty === "medium"
  ).length;

  const hardCount = allQuestions.filter(
    (question: { id: string; topic: string; difficulty: string }) => question.difficulty === "hard"
  ).length;

  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Gestionar banco
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
              {bank.name}
            </h1>

            <p className="mt-2 text-base text-slate-700">
              {bank.subject || "Sin categoría"} · {allQuestions.length}{" "}
              {allQuestions.length === 1 ? "pregunta" : "preguntas"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/banks"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Volver a bancos
            </Link>

            <Link
              href={`/practice/${bank.id}?limit=10`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Practicar 10
            </Link>

            <Link
              href={`/banks/${bank.id}/questions/new`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Añadir pregunta
            </Link>

            {isAdmin && (


              <Link


                href={`/banks/${bank.id}/edit`}


                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"


              >


                Editar banco


              </Link>


            )}

            {isAdmin && (


              <form action={deleteBank.bind(null, bank.id)}>


                <ConfirmSubmitButton
                message="¿Seguro que deseas eliminar este banco? También se eliminarán sus preguntas, respuestas, progreso y sesiones."
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
              >
                Eliminar banco


                </ConfirmSubmitButton>


              </form>


            )}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total" value={allQuestions.length} />
          <StatCard title="Fáciles" value={easyCount} />
          <StatCard title="Medias" value={mediumCount} />
          <StatCard title="Difíciles" value={hardCount} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Buscar y filtrar preguntas
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Usa estos filtros para encontrar preguntas específicas dentro del
            banco.
          </p>

          <form className="mt-5 grid gap-3 md:grid-cols-4">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar pregunta o explicación"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950 md:col-span-2"
            />

            <select
              name="topic"
              defaultValue={topic}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="">Todos los temas</option>

              {topics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              name="difficulty"
              defaultValue={difficulty}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="">Todas las dificultades</option>
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>

            <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 md:col-span-2">
              Aplicar filtros
            </button>

            <Link
              href={`/banks/${bank.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 md:col-span-2"
            >
              Limpiar filtros
            </Link>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Mostrando <strong>{questions.length}</strong> de{" "}
            <strong>{allQuestions.length}</strong> preguntas.
          </p>
        </section>

        {allQuestions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Este banco todavía no tiene preguntas
            </h2>

            <p className="mt-2 text-slate-700">
              Puedes añadir preguntas manualmente o importarlas desde CSV.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/banks/${bank.id}/questions/new`}
                className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
              >
                Añadir pregunta
              </Link>

              <Link
                href="/import"
                className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
              >
                Importar CSV
              </Link>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              No encontramos preguntas con esos filtros
            </h2>

            <p className="mt-2 text-slate-700">
              Prueba limpiar filtros o buscar con otra palabra.
            </p>

            <Link
              href={`/banks/${bank.id}`}
              className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Limpiar filtros
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question: { id: string; prompt: string; topic: string; subtopic: string | null; difficulty: string; explanation: string; options: { id: string; text: string; isCorrect: boolean }[] }, index: number) => {
              const correctOption = question.options.find(
                (option) => option.isCorrect
              );

              return (
                <article
                  key={question.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pregunta {index + 1}
                      </p>

                      <h2 className="mt-2 text-xl font-bold leading-7 text-slate-950">
                        {question.prompt}
                      </h2>

                      <p className="mt-2 text-sm text-slate-600">
                        Tema: {question.topic}
                        {question.subtopic ? ` · ${question.subtopic}` : ""} ·
                        Dificultad: {translateDifficulty(question.difficulty)}
                      </p>
                    </div>

                    {isAdmin && (


                      <Link


                        href={`/banks/${bank.id}/questions/${question.id}/edit`}


                        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"


                      >


                        Editar pregunta


                      </Link>


                    )}
                  </div>

                  <div className="mt-5 grid gap-3">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={
                          option.isCorrect
                            ? "rounded-2xl border border-green-300 bg-green-50 p-4 text-green-900"
                            : "rounded-2xl border border-slate-200 bg-white p-4 text-slate-800"
                        }
                      >
                        {option.text}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">
                      Respuesta correcta:{" "}
                      <strong className="text-slate-950">
                        {correctOption?.text || "No definida"}
                      </strong>
                    </p>

                    <p className="mt-2 text-sm text-slate-700">
                      Explicación: {question.explanation}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
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

function translateDifficulty(difficulty: string) {
  if (difficulty === "easy") return "Fácil";
  if (difficulty === "medium") return "Media";
  if (difficulty === "hard") return "Difícil";

  return difficulty;
}