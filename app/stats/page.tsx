import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/prisma";

type StatsAnswer = {
  id: string;
  isCorrect: boolean;
  answeredAt: Date;
  question: {
    prompt: string;
    topic: string;
    difficulty: string;
    bank: {
      name: string;
    };
  };
};

type StatsProgressItem = {
  id: string;
  status: string;
  wrongCount: number;
  wrongStreak: number;
  nextReviewAt: Date | null;
  question: {
    prompt: string;
    topic: string;
    bank: {
      name: string;
    };
  };
};

type ActivityDay = {
  date: Date;
  key: string;
  label: string;
};

type StatsRow = {
  label: string;
  total: number;
  correct: number;
  wrong: number;
  percent: number;
};

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLastSevenDays(): ActivityDay[] {
  const today = startOfDay(new Date());

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      date,
      key: formatDateKey(date),
      label: date.toLocaleDateString("es-PE", {
        weekday: "short",
        day: "numeric",
      }),
    };
  });
}

function calculateDailyStreak(answerDates: Date[]) {
  const answeredDays = new Set(
    answerDates.map((date: Date) => formatDateKey(startOfDay(date)))
  );

  let streak = 0;
  const cursor = startOfDay(new Date());

  while (answeredDays.has(formatDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const answers: StatsAnswer[] = await prisma.sessionAnswer.findMany({
    where: {
      session: {
        userId,
      },
    },
    include: {
      question: {
        include: {
          bank: true,
        },
      },
      session: true,
    },
    orderBy: {
      answeredAt: "desc",
    },
  });

  const progress: StatsProgressItem[] = await prisma.questionProgress.findMany({
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

  const total = answers.length;
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const wrong = total - correct;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const weakQuestions = progress.filter(
    (item) => item.status === "red" || item.wrongStreak >= 2
  );

  const masteredQuestions = progress.filter(
    (item) => item.status === "mastered"
  );

  const dueQuestions = progress.filter(
    (item) => item.nextReviewAt && item.nextReviewAt <= new Date()
  );

  const streak = calculateDailyStreak(
    answers.map((answer) => answer.answeredAt)
  );

  const lastSevenDays = getLastSevenDays();

  const activityRows = lastSevenDays.map((day) => {
    const dayAnswers = answers.filter(
      (answer) => formatDateKey(startOfDay(answer.answeredAt)) === day.key
    );

    const dayCorrect = dayAnswers.filter((answer) => answer.isCorrect).length;

    return {
      label: day.label,
      total: dayAnswers.length,
      correct: dayCorrect,
      wrong: dayAnswers.length - dayCorrect,
    };
  });

  const byBank = answers.reduce<
    Record<string, { total: number; correct: number }>
  >((acc, answer) => {
    const bankName = answer.question.bank.name || "Sin banco";

    if (!acc[bankName]) {
      acc[bankName] = {
        total: 0,
        correct: 0,
      };
    }

    acc[bankName].total += 1;

    if (answer.isCorrect) {
      acc[bankName].correct += 1;
    }

    return acc;
  }, {});

  const bankRows = Object.entries(byBank)
    .map(([bank, data]) => ({
      label: bank,
      total: data.total,
      correct: data.correct,
      wrong: data.total - data.correct,
      percent: Math.round((data.correct / data.total) * 100),
    }))
    .sort((a, b) => a.percent - b.percent);

  const byTopic = answers.reduce<
    Record<string, { total: number; correct: number }>
  >((acc, answer) => {
    const topic = answer.question.topic || "Sin tema";

    if (!acc[topic]) {
      acc[topic] = {
        total: 0,
        correct: 0,
      };
    }

    acc[topic].total += 1;

    if (answer.isCorrect) {
      acc[topic].correct += 1;
    }

    return acc;
  }, {});

  const topicRows = Object.entries(byTopic)
    .map(([topic, data]) => ({
      label: topic,
      total: data.total,
      correct: data.correct,
      wrong: data.total - data.correct,
      percent: Math.round((data.correct / data.total) * 100),
    }))
    .sort((a, b) => a.percent - b.percent);

  const byDifficulty = answers.reduce<
    Record<string, { total: number; correct: number }>
  >((acc, answer) => {
    const difficulty = answer.question.difficulty || "medium";

    if (!acc[difficulty]) {
      acc[difficulty] = {
        total: 0,
        correct: 0,
      };
    }

    acc[difficulty].total += 1;

    if (answer.isCorrect) {
      acc[difficulty].correct += 1;
    }

    return acc;
  }, {});

  const difficultyRows = Object.entries(byDifficulty)
    .map(([difficulty, data]) => ({
      label: translateDifficulty(difficulty),
      total: data.total,
      correct: data.correct,
      wrong: data.total - data.correct,
      percent: Math.round((data.correct / data.total) * 100),
    }))
    .sort((a, b) => a.percent - b.percent);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Estadísticas
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
              Tu rendimiento
            </h1>

            <p className="mt-2 max-w-3xl text-base text-slate-700">
              Analiza tu progreso, detecta temas débiles y decide qué practicar
              después.
            </p>
          </div>

          <Link
            href="/review"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
          >
            Ir a repaso
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Respondidas" value={String(total)} />
          <StatCard title="Correctas" value={String(correct)} />
          <StatCard title="Falladas" value={String(wrong)} />
          <StatCard title="% correcto" value={`${percent}%`} />
        </section>

        <section className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Racha diaria" value={`${streak} días`} />
          <StatCard title="Pendientes hoy" value={String(dueQuestions.length)} />
          <StatCard title="Débiles" value={String(weakQuestions.length)} />
          <StatCard title="Dominadas" value={String(masteredQuestions.length)} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Actividad de los últimos 7 días
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Muestra cuántas preguntas respondiste cada día.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-7">
            {activityRows.map((day) => (
              <div
                key={day.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {day.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {day.total}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {day.correct} correctas · {day.wrong} falladas
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Rendimiento por banco
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Ordenado desde el banco con menor porcentaje correcto.
          </p>

          {bankRows.length === 0 ? (
            <EmptyText />
          ) : (
            <StatsTable rows={bankRows} firstColumnTitle="Banco" />
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Rendimiento por tema
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Los temas con menor porcentaje son buenos candidatos para repasar.
          </p>

          {topicRows.length === 0 ? (
            <EmptyText />
          ) : (
            <StatsTable rows={topicRows} firstColumnTitle="Tema" />
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Rendimiento por dificultad
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Te ayuda a saber si estás fallando más en preguntas fáciles, medias
            o difíciles.
          </p>

          {difficultyRows.length === 0 ? (
            <EmptyText />
          ) : (
            <StatsTable rows={difficultyRows} firstColumnTitle="Dificultad" />
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Preguntas débiles
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Preguntas en zona roja o con racha de fallos.
              </p>
            </div>

            <Link
              href="/review/session?mode=red&limit=10"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Practicar zona roja
            </Link>
          </div>

          {weakQuestions.length === 0 ? (
            <p className="mt-4 text-slate-700">
              No tienes preguntas débiles por ahora.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {weakQuestions.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-red-100 bg-red-50 p-4"
                >
                  <p className="font-semibold text-red-950">
                    {item.question.prompt}
                  </p>

                  <p className="mt-1 text-sm text-red-800">
                    {item.question.bank.name} · {item.question.topic} · Fallos:{" "}
                    {item.wrongCount} · Racha fallida: {item.wrongStreak}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Últimas respuestas guardadas
          </h2>

          {answers.length === 0 ? (
            <p className="mt-3 text-slate-700">Aún no hay respuestas.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {answers.slice(0, 12).map((answer) => (
                <div
                  key={answer.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-950">
                    {answer.question.prompt}
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {answer.isCorrect ? "Correcta" : "Fallada"} ·{" "}
                    {answer.question.bank.name} · {answer.question.topic} ·{" "}
                    {answer.answeredAt.toLocaleString("es-PE")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function StatsTable({
  rows,
  firstColumnTitle,
}: {
  rows: StatsRow[];
  firstColumnTitle: string;
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="py-3 pr-4">{firstColumnTitle}</th>
            <th className="py-3 pr-4">Total</th>
            <th className="py-3 pr-4">Correctas</th>
            <th className="py-3 pr-4">Falladas</th>
            <th className="py-3 pr-4">% correcto</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-slate-100 last:border-b-0"
            >
              <td className="py-3 pr-4 font-semibold text-slate-950">
                {row.label}
              </td>
              <td className="py-3 pr-4 text-slate-700">{row.total}</td>
              <td className="py-3 pr-4 text-slate-700">{row.correct}</td>
              <td className="py-3 pr-4 text-slate-700">{row.wrong}</td>
              <td className="py-3 pr-4 font-semibold text-slate-950">
                {row.percent}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyText() {
  return (
    <p className="mt-3 text-slate-700">
      Todavía no hay respuestas guardadas.
    </p>
  );
}

function translateDifficulty(difficulty: string) {
  if (difficulty === "easy") return "Fácil";
  if (difficulty === "medium") return "Media";
  if (difficulty === "hard") return "Difícil";

  return difficulty;
}
