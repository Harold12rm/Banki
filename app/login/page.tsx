import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=Correo%20y%20contraseÃ±a%20son%20obligatorios.");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message =
      error.message === "Email not confirmed"
        ? "Debes confirmar tu correo o desactivar Confirm email en Supabase para desarrollo."
        : error.message;

    redirect("/login?error=" + encodeURIComponent(message));
  }

  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-md space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Banki
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Iniciar sesiÃ³n
          </h1>

          <p className="mt-2 text-slate-700">
            Accede para guardar tu progreso, estadÃ­sticas y repeticiÃ³n espaciada.
          </p>
        </header>

        {params.message && (
          <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            {params.message}
          </p>
        )}

        {params.error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {params.error}
          </p>
        )}

        <form
          action={login}
          className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Correo
            </label>

            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              ContraseÃ±a
            </label>

            <input
              name="password"
              type="password"
              required
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <button className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50">
            Entrar
          </button>

          <p className="text-center text-sm text-slate-600">
            Â¿No tienes cuenta?{" "}
            <Link href="/signup" className="font-semibold text-slate-950">
              Crear cuenta
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

