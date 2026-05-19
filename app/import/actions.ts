"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type ImportRow = {
  bank?: string;
  prompt?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  correctOption?: string;
  explanation?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
};

function normalizeKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function normalizeRow(row: Record<string, unknown>): ImportRow {
  const normalized: ImportRow = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = normalizeKey(key);
    const cleanValue = String(value ?? "").trim();

    if (cleanKey === "bank") normalized.bank = cleanValue;
    if (cleanKey === "prompt") normalized.prompt = cleanValue;

    if (cleanKey === "option1") normalized.option1 = cleanValue;
    if (cleanKey === "option2") normalized.option2 = cleanValue;
    if (cleanKey === "option3") normalized.option3 = cleanValue;
    if (cleanKey === "option4") normalized.option4 = cleanValue;
    if (cleanKey === "option5") normalized.option5 = cleanValue;

    if (cleanKey === "correctoption") normalized.correctOption = cleanValue;
    if (cleanKey === "explanation") normalized.explanation = cleanValue;
    if (cleanKey === "topic") normalized.topic = cleanValue;
    if (cleanKey === "subtopic") normalized.subtopic = cleanValue;
    if (cleanKey === "difficulty") normalized.difficulty = cleanValue;
  }

  return normalized;
}

function parseCorrectOption(value: string) {
  const clean = value.trim().toUpperCase();

  const letterMap: Record<string, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
  };

  if (letterMap[clean]) {
    return letterMap[clean];
  }

  const number = Number(clean);

  return Number.isInteger(number) ? number : 0;
}

function normalizeDifficulty(value: string) {
  const clean = value.trim().toLowerCase();

  if (["facil", "fÃ¡cil", "easy"].includes(clean)) return "easy";
  if (["media", "medio", "medium"].includes(clean)) return "medium";
  if (["dificil", "difÃ­cil", "hard"].includes(clean)) return "hard";

  return "medium";
}

function normalizePrompt(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function importQuestions(
  rows: Record<string, unknown>[],
  targetBankId?: string
) {
  if (!rows.length) {
    throw new Error("No hay filas para importar.");
  }

  let selectedBank:
    | {
        id: string;
        name: string;
        subject: string | null;
      }
    | null = null;

  if (targetBankId) {
    selectedBank = await prisma.questionBank.findUnique({
      where: {
        id: targetBankId,
      },
    });

    if (!selectedBank) {
      throw new Error("El banco seleccionado no existe.");
    }
  }

  let createdQuestions = 0;
  let skippedRows = 0;
  let duplicatedRows = 0;

  for (const rawRow of rows) {
    const row = normalizeRow(rawRow);

    const bankNameFromCsv = String(row.bank || "").trim();
    const prompt = normalizePrompt(String(row.prompt || ""));
    const explanation = String(row.explanation || "").trim();
    const topic = String(row.topic || "").trim();
    const subtopic = String(row.subtopic || "").trim();
    const difficulty = normalizeDifficulty(String(row.difficulty || "medium"));
    const correctOption = parseCorrectOption(String(row.correctOption || ""));

    const optionTexts = [
      row.option1,
      row.option2,
      row.option3,
      row.option4,
      row.option5,
    ]
      .map((option) => String(option || "").trim())
      .filter(Boolean);

    const isEmptyRow =
      !bankNameFromCsv &&
      !prompt &&
      !explanation &&
      !topic &&
      optionTexts.length === 0;

    if (isEmptyRow) {
      continue;
    }

    if (!prompt || !explanation || !topic) {
      skippedRows += 1;
      continue;
    }

    if (!selectedBank && !bankNameFromCsv) {
      skippedRows += 1;
      continue;
    }

    if (optionTexts.length < 2) {
      skippedRows += 1;
      continue;
    }

    if (
      !Number.isInteger(correctOption) ||
      correctOption < 1 ||
      correctOption > optionTexts.length
    ) {
      skippedRows += 1;
      continue;
    }

    let bank = selectedBank;

    if (!bank) {
      bank = await prisma.questionBank.findFirst({
        where: {
          name: bankNameFromCsv,
        },
      });

      if (!bank) {
        bank = await prisma.questionBank.create({
          data: {
            name: bankNameFromCsv,
            subject: topic,
          },
        });
      }
    }

    const existingQuestion = await prisma.question.findFirst({
      where: {
        bankId: bank.id,
        prompt,
      },
      select: {
        id: true,
      },
    });

    if (existingQuestion) {
      duplicatedRows += 1;
      continue;
    }

    await prisma.question.create({
      data: {
        bankId: bank.id,
        prompt,
        explanation,
        topic,
        subtopic: subtopic || null,
        difficulty,
        options: {
          create: optionTexts.map((text, index) => ({
            text,
            isCorrect: index + 1 === correctOption,
          })),
        },
      },
    });

    createdQuestions += 1;
  }

  return {
    createdQuestions,
    skippedRows,
    duplicatedRows,
  };
}
