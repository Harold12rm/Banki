import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

async function createBank(formData: FormData) {
  "use server";

  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();

  if (!name) {
    throw new Error("El nombre del banco es obligatorio.");
  }

  const bank = await prisma.questionBank.create({
    data: {
      name,
      subject: subject || null,
    },
  });

  redirect(`/banks/${bank.id}`);
}

export default async function NewBankPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Nuevo banco
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Crear banco
          </h1>

          <p className="mt-2 text-slate-700">
            Crea una colección para organizar preguntas por curso, tema o
            examen.
          </p>
        </header>

        <form
          action={createBank}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Nombre del banco
            </label>

            <input
              name="name"
              required
              placeholder="Ejemplo: ENAM 2026"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Curso o categoría
            </label>

            <input
              name="subject"
              placeholder="Ejemplo: Salud Pública"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <button className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50">
            Crear banco
          </button>
        </form>
      </section>
    </main>
  );
}