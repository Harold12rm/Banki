import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

async function createQuestion(bankId: string, formData: FormData) {
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
    throw new Error("Debes agregar al menos 2 alternativas.");
  }

  if (!correctOption || correctOption < 1 || correctOption > optionTexts.length) {
    throw new Error("La alternativa correcta no es válida.");
  }

  await prisma.question.create({
    data: {
      bankId,
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

  redirect(`/banks/${bankId}`);
}

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  await requireAdmin();

  const { bankId } = await params;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Añadir pregunta</h1>
          <p className="text-slate-600">
            Crea una pregunta con alternativas y explicación.
          </p>
        </header>

        <form
          action={createQuestion.bind(null, bankId)}
          className="space-y-4 rounded-2xl border bg-white p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Pregunta</label>
            <textarea
              name="prompt"
              required
              rows={4}
              placeholder="Ej. ¿Cuál es la causa más frecuente de fibrilación auricular?"
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n}>
              <label className="mb-1 block text-sm font-medium">
                Alternativa {n}
              </label>
              <input
                name={`option${n}`}
                required={n <= 2}
                placeholder={`Alternativa ${n}`}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Alternativa correcta
            </label>
            <select
              name="correctOption"
              defaultValue="1"
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="1">Alternativa 1</option>
              <option value="2">Alternativa 2</option>
              <option value="3">Alternativa 3</option>
              <option value="4">Alternativa 4</option>
              <option value="5">Alternativa 5</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tema</label>
            <input
              name="topic"
              required
              placeholder="Ej. Cardiología"
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Subtema</label>
            <input
              name="subtopic"
              placeholder="Ej. Arritmias"
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Dificultad</label>
            <select
              name="difficulty"
              defaultValue="medium"
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Explicación</label>
            <textarea
              name="explanation"
              required
              rows={4}
              placeholder="Explica por qué la respuesta correcta es correcta."
              className="w-full rounded-xl border px-3 py-2"
            />
          </div>

          <button className="w-full rounded-xl bg-black px-4 py-2 text-white">
            Guardar pregunta
          </button>
        </form>
      </section>
    </main>
  );
}
