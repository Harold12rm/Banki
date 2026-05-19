"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

type SavePracticeAnswerInput = {
  bankId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
};

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function calculateProgressUpdate({
  progress,
  isCorrect,
  now,
}: {
  progress: {
    correctCount: number;
    wrongCount: number;
    correctStreak: number;
    wrongStreak: number;
    repetitions: number;
    lapses: number;
    intervalDays: number;
    easeFactor: number;
    lastAnsweredAt: Date | null;
  } | null;
  isCorrect: boolean;
  now: Date;
}) {
  const correctCount = progress?.correctCount ?? 0;
  const wrongCount = progress?.wrongCount ?? 0;
  const currentCorrectStreak = progress?.correctStreak ?? 0;
  const currentWrongStreak = progress?.wrongStreak ?? 0;
  const repetitions = progress?.repetitions ?? 0;
  const lapses = progress?.lapses ?? 0;
  const intervalDays = progress?.intervalDays ?? 0;
  const easeFactor = progress?.easeFactor ?? 2.5;
  const lastAnsweredAt = progress?.lastAnsweredAt ?? null;

  const alreadyAnsweredToday = isSameDay(lastAnsweredAt, now);

  if (!isCorrect) {
    const newWrongStreak = currentWrongStreak + 1;

    let nextReviewAt = addMinutes(now, 10);

    if (newWrongStreak === 2) {
      nextReviewAt = addMinutes(now, 60);
    }

    if (newWrongStreak >= 3) {
      nextReviewAt = addDays(now, 1);
    }

    return {
      correctCount,
      wrongCount: wrongCount + 1,
      correctStreak: 0,
      wrongStreak: newWrongStreak,
      repetitions,
      lapses: lapses + 1,
      intervalDays: 0,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      status: newWrongStreak >= 3 ? "red" : "learning",
      lastAnsweredAt: now,
      nextReviewAt,
      masteredAt: null,
    };
  }

  const canIncreaseDailyStreak = !alreadyAnsweredToday;

  const newCorrectStreak = canIncreaseDailyStreak
    ? currentCorrectStreak + 1
    : currentCorrectStreak;

  const newRepetitions = repetitions + 1;
  const newEaseFactor = Math.min(3.0, easeFactor + 0.05);

  let newIntervalDays = intervalDays;
  let nextReviewAt = addDays(now, 1);
  let status = "learning";
  let masteredAt: Date | null = null;

  if (newCorrectStreak <= 1) {
    newIntervalDays = 1;
    nextReviewAt = addDays(now, 1);
    status = "learning";
  } else if (newCorrectStreak === 2) {
    newIntervalDays = 3;
    nextReviewAt = addDays(now, 3);
    status = "reviewing";
  } else if (newCorrectStreak === 3) {
    newIntervalDays = 7;
    nextReviewAt = addDays(now, 7);
    status = "almost_mastered";
  } else if (newCorrectStreak === 4) {
    newIntervalDays = 14;
    nextReviewAt = addDays(now, 14);
    status = "mastered";
    masteredAt = now;
  } else {
    newIntervalDays = Math.max(30, Math.round(intervalDays * newEaseFactor));
    nextReviewAt = addDays(now, newIntervalDays);
    status = "mastered";
    masteredAt = now;
  }

  return {
    correctCount: correctCount + 1,
    wrongCount,
    correctStreak: newCorrectStreak,
    wrongStreak: 0,
    repetitions: newRepetitions,
    lapses,
    intervalDays: newIntervalDays,
    easeFactor: newEaseFactor,
    status,
    lastAnsweredAt: now,
    nextReviewAt,
    masteredAt,
  };
}

export async function savePracticeAnswer(data: SavePracticeAnswerInput) {
  console.log("INICIANDO savePracticeAnswer:", data);

  if (!data.bankId) {
    throw new Error("Falta el banco.");
  }

  if (!data.questionId || !data.selectedOptionId) {
    throw new Error("Falta la respuesta.");
  }

  const now = new Date();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesiï¿½n para guardar tu progreso.");
  }

  const userId = user.id;

  const session = await prisma.practiceSession.create({
    data: {
      bankId: data.bankId,
      userId,
      mode: "practice",
      endedAt: now,
    },
  });

  console.log("PracticeSession creada:", session.id);

  const answer = await prisma.sessionAnswer.create({
    data: {
      sessionId: session.id,
      questionId: data.questionId,
      selectedOptionId: data.selectedOptionId,
      isCorrect: data.isCorrect,
      answeredAt: now,
    },
  });

  console.log("SessionAnswer creada:", answer.id);

  try {
    const currentProgress = await prisma.questionProgress.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId: data.questionId,
        },
      },
    });

    const progressUpdate = calculateProgressUpdate({
      progress: currentProgress,
      isCorrect: data.isCorrect,
      now,
    });

    const progress = await prisma.questionProgress.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId: data.questionId,
        },
      },
      update: progressUpdate,
      create: {
        userId,
        questionId: data.questionId,
        ...progressUpdate,
      },
    });

    console.log("QuestionProgress actualizado:", progress.id);
  } catch (error) {
    console.error("Error actualizando QuestionProgress:", error);
  }

  return {
    saved: true,
    sessionId: session.id,
    answerId: answer.id,
  };
}
