import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

async function updateBank(bankId: string, formData: FormData) {
  "use server";

  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();

  if (!name) {
    throw new Error("El nombre del banco es obligatorio.");
  }

  await prisma.questionBank.update({
    where: {
      id: bankId,
    },
    data: {
      name,
      subject: subject || null,
    },
  });

  redirect(`/banks/${bankId}`);
}

export default async function EditBankPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  await requireAdmin();

  const { bankId } = await params;

  const bank = await prisma.questionBank.findUnique({
    where: {
      id: bankId,
    },
  });

  if (!bank) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Editar
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Editar banco
          </h1>

          <p className="mt-2 text-slate-700">
            Modifica el nombre o categoría del banco.
          </p>
        </header>

        <form
          action={updateBank.bind(null, bank.id)}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Nombre del banco
            </label>

            <input
              name="name"
              required
              defaultValue={bank.name}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Categoría o curso
            </label>

            <input
              name="subject"
              defaultValue={bank.subject || ""}
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