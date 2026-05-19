import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { requireAdmin } from "@/lib/auth";

type EditOption = {
  id: string;
  text: string;
  isCorrect: boolean;
  questionId: string;
};

type EditQuestion = {
  id: string;
  bankId: string;
  prompt: string;
  explanation: string;
  topic: string;
  subtopic: string | null;
  difficulty: string;
  options: EditOption[];
};

async function updateQuestion(
  bankId: string,
  questionId: string,
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const prompt = String(formData.get("prompt") || "").trim();
  const topic = String(formData.get("topic") || "").trim();
  const subtopic = String(formData.get("subtopic") || "").trim();
  const difficulty = String(formData.get("difficulty") || "medium").trim();
  const explanation = String(formData.get("explanation") || "").trim();
  const correctOption = Number(formData.get("correctOption"));

  const optionTexts = [1, 2, 3, 4, 5]
    .map((n) => String(formData.get(`option${n}`) || "").trim())
    .filter(Boolean);

  if (!prompt || !topic || !explanation) {
    throw new Error("Pregunta, tema y explicación son obligatorios.");
  }

  if (optionTexts.length < 2) {
    throw new Error("Debes tener al menos 2 alternativas.");
  }

  if (
    !Number.isInteger(correctOption) ||
    correctOption < 1 ||
    correctOption > optionTexts.length
  ) {
    throw new Error("La alternativa correcta no es válida.");
  }

  await prisma.question.update({
    where: {
      id: questionId,
    },
    data: {
      prompt,
      explanation,
      topic,
      subtopic: subtopic || null,
      difficulty,
    },
  });

  await prisma.answerOption.deleteMany({
    where: {
      questionId,
    },
  });

  await prisma.answerOption.createMany({
    data: optionTexts.map((text, index) => ({
      questionId,
      text,
      isCorrect: index + 1 === correctOption,
    })),
  });

  redirect(`/banks/${bankId}`);
}

async function deleteQuestion(bankId: string, questionId: string) {
  "use server";

  await requireAdmin();

  await prisma.sessionAnswer.deleteMany({
    where: {
      questionId,
    },
  });

  await prisma.markedQuestion.deleteMany({
    where: {
      questionId,
    },
  });

  await prisma.answerOption.deleteMany({
    where: {
      questionId,
    },
  });

  await prisma.question.delete({
    where: {
      id: questionId,
    },
  });

  redirect(`/banks/${bankId}`);
}

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ bankId: string; questionId: string }>;
}) {
  await requireAdmin();

  const { bankId, questionId } = await params;

  const question = (await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      options: true,
    },
  })) as EditQuestion | null;

  if (!question || question.bankId !== bankId) {
    notFound();
  }

  const options = [...question.options];

  while (options.length < 5) {
    options.push({
      id: "",
      text: "",
      isCorrect: false,
      questionId: question.id,
    });
  }

  const correctIndex = options.findIndex((option) => option.isCorrect);
  const correctOptionValue = correctIndex >= 0 ? String(correctIndex + 1) : "1";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-2xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Editar
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
              Editar pregunta
            </h1>

            <p className="mt-2 text-slate-700">
              Modifica la pregunta, alternativas, respuesta correcta y
              explicación.
            </p>
          </div>

          <form action={deleteQuestion.bind(null, bankId, question.id)}>
  <ConfirmSubmitButton
    message="¿Seguro que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
  >
    Eliminar pregunta
  </ConfirmSubmitButton>
</form>
        </header>

        <form
          action={updateQuestion.bind(null, bankId, question.id)}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Pregunta
            </label>

            <textarea
              name="prompt"
              required
              rows={4}
              defaultValue={question.prompt}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          {options.slice(0, 5).map((option, index) => {
            const n = index + 1;

            return (
              <div key={n}>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Alternativa {n}
                </label>

                <input
                  name={`option${n}`}
                  required={n <= 2}
                  defaultValue={option.text}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                />
              </div>
            );
          })}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Alternativa correcta
            </label>

            <select
              name="correctOption"
              defaultValue={correctOptionValue}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="1">Alternativa 1</option>
              <option value="2">Alternativa 2</option>
              <option value="3">Alternativa 3</option>
              <option value="4">Alternativa 4</option>
              <option value="5">Alternativa 5</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Tema
            </label>

            <input
              name="topic"
              required
              defaultValue={question.topic}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Subtema
            </label>

            <input
              name="subtopic"
              defaultValue={question.subtopic || ""}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Dificultad
            </label>

            <select
              name="difficulty"
              defaultValue={question.difficulty}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Explicación
            </label>

            <textarea
              name="explanation"
              required
              rows={5}
              defaultValue={question.explanation}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <button className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50">
            Guardar cambios
          </button>
        </form>
      </section>
    </main>
  );
}
