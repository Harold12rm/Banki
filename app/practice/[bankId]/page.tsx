import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PracticeSession from "@/components/PracticeSession";
import { getCurrentUser } from "@/lib/supabase/server";
import type { PracticeQuestion } from "@/lib/practice-question";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function shuffleArray<T>(array: readonly T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function getSafeLimit(value?: string) {
  const limit = Number(value);

  if (limit === 20) return 20;
  if (limit === 50) return 50;

  return 10;
}

export default async function PracticeBankPage({
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

  const bank = await prisma.questionBank.findUnique({
    where: {
      id: bankId,
    },
  });

  if (!bank) {
    notFound();
  }

  const questions = (await prisma.question.findMany({
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
    select: {
      id: true,
      prompt: true,
      explanation: true,
      topic: true,
      subtopic: true,
      difficulty: true,
      options: {
        select: {
          id: true,
          text: true,
          isCorrect: true,
        },
      },
    },
  })) as PracticeQuestion[];

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Práctica
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            {bank.name}
          </h1>

          <p className="mt-2 text-slate-700">
            No hay preguntas disponibles para este modo.
          </p>
        </section>
      </main>
    );
  }

  const selectedQuestions: PracticeQuestion[] = shuffleArray(questions).slice(
    0,
    limit
  );

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <PracticeSession
          bankId={bank.id}
          bankName={bank.name}
          questions={selectedQuestions}
        />
      </section>
    </main>
  );
}
