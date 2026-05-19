import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";

type MissedQuestion = {
  id: string;
  prompt: string;
  explanation: string;
  topic: string;
  subtopic: string | null;
  difficulty: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
};

type MissedAnswer = {
  question: MissedQuestion;
};

export default async function MissedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const missedAnswers: MissedAnswer[] = await prisma.sessionAnswer.findMany({
    where: {
      isCorrect: false,
      session: {
        userId: userId,
      },
    },
    include: {
      question: {
        include: {
          options: true,
        },
      },
    },
    orderBy: {
      answeredAt: "desc",
    },
  });

  const uniqueQuestions: MissedQuestion[] = Array.from(
    new Map<string, MissedQuestion>(
      missedAnswers.map((answer) => [answer.question.id, answer.question])
    ).values()
  );

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Repaso
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Preguntas falladas
          </h1>

          <p className="mt-2 max-w-2xl text-base text-slate-700">
            Revisa las preguntas que respondiste incorrectamente para reforzar
            tus temas dÃ©biles.
          </p>
        </header>

        {uniqueQuestions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              No tienes preguntas falladas
            </h2>

            <p className="mt-2 text-slate-700">
              Cuando falles una pregunta en prÃ¡ctica, aparecerÃ¡ aquÃ­ para que
              puedas repasarla.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {uniqueQuestions.map((question) => {
              const correctOption = question.options.find(
                (option) => option.isCorrect
              );

              return (
                <article
                  key={question.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {question.topic}
                        {question.subtopic ? ` Â· ${question.subtopic}` : ""}
                      </p>

                      <h2 className="mt-2 text-xl font-bold text-slate-950">
                        {question.prompt}
                      </h2>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {question.difficulty}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-semibold text-green-800">
                      Respuesta correcta
                    </p>

                    <p className="mt-1 text-sm text-green-900">
                      {correctOption?.text || "No definida"}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      ExplicaciÃ³n
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {question.explanation}
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
