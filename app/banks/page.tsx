import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { getCurrentProfile } from "@/lib/auth";

async function deleteBank(bankId: string) {
  "use server";

  const questions = await prisma.question.findMany({
    where: { bankId },
    select: { id: true },
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

export default async function BanksPage() {
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

  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Banki
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
              Bancos de preguntas
            </h1>

            <p className="mt-2 max-w-2xl text-base text-slate-700">
              Administra tus bancos, edita preguntas y empieza sesiones cortas
              de prÃ¡ctica.
            </p>
          </div>

          {isAdmin && (


            <Link


              href="/banks/new"


              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"


            >


              Crear banco


            </Link>


          )}
        </header>

        {banks.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              TodavÃ­a no hay bancos creados
            </h2>

            <p className="mt-2 text-slate-700">
              Crea tu primer banco o importa preguntas desde CSV.
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
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {banks.map((bank) => (
              <article
                key={bank.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-950">
                      {bank.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {bank.subject || "Sin categorÃ­a"}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {bank._count.questions}{" "}
                    {bank._count.questions === 1 ? "pregunta" : "preguntas"}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/banks/${bank.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
                  >
                    Gestionar preguntas
                  </Link>

                  <Link
                    href={`/practice/${bank.id}/start?limit=10`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
                  >
                    Practicar 10
                  </Link>

                  {isAdmin && (


                    <Link


                      href={`/banks/${bank.id}/edit`}


                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"


                    >


                      Editar banco


                    </Link>


                  )}

                  {isAdmin && (


                    <form action={deleteBank.bind(null, bank.id)}>


                      <ConfirmSubmitButton
                      message="Â¿Seguro que deseas eliminar este banco? TambiÃ©n se eliminarÃ¡n sus preguntas, respuestas, progreso y sesiones."
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
                    >
                      Eliminar banco


                      </ConfirmSubmitButton>


                    </form>


                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  {isAdmin && (
                    <Link
                      href={`/banks/${bank.id}/questions/new`}
                      className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                    >
                      AÃ±adir pregunta â†’
                    </Link>
                  )}

                  <Link
                    href={`/practice/${bank.id}/start?limit=20`}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                  >
                    Practicar 20 â†’
                  </Link>

                  <Link
                    href={`/practice/${bank.id}/start?limit=50`}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                  >
                    Simulacro 50 â†’
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

