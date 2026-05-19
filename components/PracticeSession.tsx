"use client";

import { useMemo, useState } from "react";
import { savePracticeAnswer } from "@/app/practice/actions";

type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  prompt: string;
  explanation: string;
  topic: string;
  subtopic: string | null;
  difficulty: string;
  options: Option[];
};

type PracticeSessionProps = {
  bankId: string;
  bankName: string;
  questions: Question[];
};

export default function PracticeSession({
  bankId,
  bankName,
  questions,
}: PracticeSessionProps) {
  const shuffledQuestions = useMemo(() => {
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions]);

  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [answered, setAnswered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);

  const finished = index >= shuffledQuestions.length;

  if (finished) {
    const total = shuffledQuestions.length;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Resultado
          </p>

          <h1 className="mt-1 text-4xl font-bold text-slate-950">
            Sesión finalizada
          </h1>

          <p className="mt-2 text-slate-700">
            Respondiste {correctCount} de {total} preguntas correctamente.
          </p>

          <p className="mt-2 text-sm font-medium text-green-700">
            Tus respuestas se guardaron automáticamente durante la práctica.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Correctas</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">
              {correctCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Falladas</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">
              {wrongQuestions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">% correcto</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">
              {percent}%
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Preguntas falladas
          </h2>

          {wrongQuestions.length === 0 ? (
            <p className="mt-2 text-slate-700">
              Excelente. No fallaste ninguna pregunta.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {wrongQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-950">
                    {question.prompt}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Tema: {question.topic}
                    {question.subtopic ? ` · ${question.subtopic}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {wrongQuestions.length > 0 && (
          <button
            type="button"
            onClick={() => exportWrongToAnki(wrongQuestions)}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
          >
            Exportar falladas para Anki
          </button>
        )}
      </div>
    );
  }

  const question = shuffledQuestions[index];

  const selectedOption = question.options.find(
    (option) => option.id === selectedId
  );

  const correctOption = question.options.find((option) => option.isCorrect);

  const isCorrect = Boolean(selectedOption?.isCorrect);

  async function handleAnswer() {
    if (!selectedOption) return;

    try {
      setSaving(true);
      setSaveError("");

      await savePracticeAnswer({
        bankId,
        questionId: question.id,
        selectedOptionId: selectedOption.id,
        isCorrect: selectedOption.isCorrect,
      });

      setAnswered(true);

      if (selectedOption.isCorrect) {
        setCorrectCount((value) => value + 1);
      } else {
        setWrongQuestions((value) => [...value, question]);
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la respuesta."
      );
    } finally {
      setSaving(false);
    }
  }

  function nextQuestion() {
    setSelectedId("");
    setAnswered(false);
    setSaveError("");
    setIndex((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {bankName} · Pregunta {index + 1} de {shuffledQuestions.length}
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {question.prompt}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Tema: {question.topic}
          {question.subtopic ? ` · ${question.subtopic}` : ""} ·{" "}
          {question.difficulty}
        </p>
      </header>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {question.options.map((option) => {
          const selected = selectedId === option.id;
          const showCorrect = answered && option.isCorrect;
          const showWrong = answered && selected && !option.isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered || saving}
              onClick={() => setSelectedId(option.id)}
              className={[
                "w-full rounded-2xl border p-4 text-left text-sm font-medium transition",
                selected
                  ? "border-slate-950 bg-slate-100 text-slate-950"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                showCorrect
                  ? "border-green-500 bg-green-50 text-green-900"
                  : "",
                showWrong ? "border-red-500 bg-red-50 text-red-900" : "",
              ].join(" ")}
            >
              {option.text}
            </button>
          );
        })}

        {saveError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {saveError}
          </p>
        )}

        {!answered ? (
          <button
            type="button"
            disabled={!selectedId || saving}
            onClick={handleAnswer}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Responder"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p
                className={
                  isCorrect
                    ? "font-bold text-green-700"
                    : "font-bold text-red-700"
                }
              >
                {isCorrect ? "Correcto" : "Incorrecto"}
              </p>

              <p className="mt-2 text-sm text-slate-800">
                Respuesta correcta:{" "}
                <strong>{correctOption?.text || "No definida"}</strong>
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {question.explanation}
              </p>

              <p className="mt-3 text-xs font-medium text-green-700">
                Respuesta guardada automáticamente.
              </p>
            </div>

            <button
              type="button"
              onClick={nextQuestion}
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
            >
              Siguiente pregunta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function exportWrongToAnki(wrongQuestions: Question[]) {
  const rows = wrongQuestions.map((question) => {
    const correct = question.options.find((option) => option.isCorrect);

    const front = question.prompt;

    const back = [
      `Respuesta: ${correct?.text || ""}`,
      "",
      "Explicación:",
      question.explanation,
      "",
      `Tema: ${question.topic}`,
      question.subtopic ? `Subtema: ${question.subtopic}` : "",
      `Dificultad: ${question.difficulty}`,
    ]
      .filter(Boolean)
      .join("\n");

    const tags = [
      "Banki",
      question.topic,
      question.subtopic || "",
      question.difficulty,
    ]
      .filter(Boolean)
      .join(" ");

    return [front, back, tags];
  });

  const csv = [["Front", "Back", "Tags"], ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "banki-falladas-anki.csv";
  link.click();

  URL.revokeObjectURL(url);
}