import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-10">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Aprende con repetición espaciada
              </p>

              <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950 md:text-6xl">
                Banki convierte tus preguntas en aprendizaje real.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Practica sesiones cortas, detecta tus preguntas débiles, repasa
                cuando toca y mide tu progreso por banco, tema y dificultad.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-50"
                >
                  {user ? "Ir a mi panel" : "Crear cuenta"}
                </Link>

                <Link
                  href={user ? "/practice" : "/login"}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-white"
                >
                  {user ? "Practicar ahora" : "Iniciar sesión"}
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <div className="grid gap-4">
                <FeatureCard
                  title="Sesiones cortas"
                  description="Practica 10, 20 o simulacros de 50 preguntas."
                />

                <FeatureCard
                  title="Repetición espaciada"
                  description="Banki prioriza pendientes, zona roja y no dominadas."
                />

                <FeatureCard
                  title="Estadísticas útiles"
                  description="Mide rendimiento por banco, tema, dificultad y actividad."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MiniCard
            title="Importa CSV"
            description="Carga bancos desde Google Sheets o Excel con vista previa."
          />

          <MiniCard
            title="Repasa inteligente"
            description="Vuelve sobre lo que fallaste en el momento adecuado."
          />

          <MiniCard
            title="Administra bancos"
            description="Edita preguntas, opciones, explicaciones y temas."
          />
        </section>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}

function MiniCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </div>
  );
}
