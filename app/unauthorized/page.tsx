import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Acceso restringido
        </p>

        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
          No tienes permisos de administrador
        </h1>

        <p className="mt-3 text-slate-700">
          Esta secci�n est� reservada para administrar bancos, preguntas e importaciones.
        </p>

        <Link
          href="/practice"
          className="mt-6 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50"
        >
          Ir a practicar
        </Link>
      </section>
    </main>
  );
}
