import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ImportQuestionsForm from "@/components/ImportQuestionsForm";

type BankOption = {
  id: string;
  name: string;
  subject: string | null;
};

export default async function ImportPage() {
  await requireAdmin();

  const banks: BankOption[] = await prisma.questionBank.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      subject: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Importar
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Importar preguntas desde CSV
          </h1>

          <p className="mt-2 max-w-3xl text-base text-slate-700">
            Sube preguntas desde Google Sheets o Excel. Puedes usar la columna
            BANK del CSV o importar todo dentro de un banco ya creado.
          </p>
        </header>

        <ImportQuestionsForm banks={banks} />
      </section>
    </main>
  );
}
