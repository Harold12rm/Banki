import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

async function signup(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/signup?error=Correo%20y%20contraseña%20son%20obligatorios.");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  if (data.user) {
    await prisma.profile.upsert({
      where: {
        id: data.user.id,
      },
      update: {
        email,
      },
      create: {
        id: data.user.id,
        email,
      },
    });
  }

  redirect("/dashboard");
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-md space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Banki
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
            Crear cuenta
          </h1>

          <p className="mt-2 text-slate-700">
            Crea una cuenta para guardar tu progreso personal.
          </p>
        </header>

        {params.error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {params.error}
          </p>
        )}

        <form
          action={signup}
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
              Contraseña
            </label>

            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </div>

          <button className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50">
            Crear cuenta
          </button>

          <p className="text-center text-sm text-slate-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-slate-950">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

