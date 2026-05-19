import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PracticeSession from "@/components/PracticeSession";

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getSafeLimit(value?: string) {
  const limit = Number(value);

  if (limit === 20) return 20;
  if (limit === 50) return 50;

  return 10;
}

function getModeLabel(mode: string) {
  if (mode === "due") return "Pendientes de repaso";
  if (mode === "red") return "Zona roja";
  if (mode === "learning") return "Aprendiendo";
  if (mode === "not-mastered") return "No dominadas";
  if (mode === "all") return "Todas con progreso";

  return "Repaso";
}

export default async function ReviewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    limit?: string;
    bankId?: string;
    topic?: string;
    difficulty?: string;
  }>;
}) {
  const params = await searchParams;

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const now = new Date();

  const mode = params.mode || "due";
  const limit = getSafeLimit(params.limit);
  const bankId = params.bankId || "";
  const topic = params.topic || "";
  const difficulty = params.difficulty || "";

  const progressItems = await prisma.questionProgress.findMany({
    where: {
      userId,

      ...(mode === "due"
        ? {
            nextReviewAt: {
              lte: now,
            },
          }
        : {}),

      ...(mode === "red"
        ? {
            status: "red",
          }
        : {}),

      ...(mode === "learning"
        ? {
            status: "learning",
          }
        : {}),

      ...(mode === "not-mastered"
        ? {
            status: {
              not: "mastered",
            },
          }
        : {}),

      question: {
        is: {
          ...(bankId
            ? {
                bankId,
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
      },
    },
    include: {
      question: {
        include: {
          options: true,
          bank: true,
        },
      },
    },
    orderBy: [
      {
        nextReviewAt: "asc",
      },
      {
        wrongStreak: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  const questions = shuffleArray(
    progressItems.map(
    (item: {
      question: {
        id: string;
        prompt: string;
        explanation: string;
        topic: string;
        subtopic: string | null;
        difficulty: string;
        createdAt: Date;
        bankId: string;
        options: {
          id: string;
          text: string;
          isCorrect: boolean;
          questionId: string;
        }[];
        bank: {
          id: string;
          name: string;
          subject: string | null;
          createdAt: Date;
        };
      };
    }) => item.question
  )
  ).slice(0, limit);

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Repaso
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            No hay preguntas para este repaso
          </h1>

          <p className="mt-2 text-slate-700">
            No encontramos preguntas con los filtros seleccionados.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/review"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Volver a repaso
            </Link>

            <Link
              href="/practice"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Ir a practicar
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Repaso inteligente
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            {getModeLabel(mode)} Â· {questions.length} preguntas
          </h1>

          <p className="mt-2 text-sm text-slate-700">
            Esta sesiÃ³n fue generada segÃºn tu progreso y filtros seleccionados.
          </p>
        </div>

        <PracticeSession
          bankId={questions[0].bankId}
          bankName="Repaso inteligente"
          questions={questions}
        />
      </section>
    </main>
  );
}
