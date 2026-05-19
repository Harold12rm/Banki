import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await prisma.profile.upsert({
    where: {
      id: user.id,
    },
    update: {
      email: user.email || "",
    },
    create: {
      id: user.id,
      email: user.email || "",
      role: "user",
    },
  });

  return profile;
}

export async function requireAdmin() {
  const user = await requireUser();

  const profile = await prisma.profile.upsert({
    where: {
      id: user.id,
    },
    update: {
      email: user.email || "",
    },
    create: {
      id: user.id,
      email: user.email || "",
      role: "user",
    },
  });

  if (profile.role !== "admin") {
    redirect("/practice");
  }

  return profile;
}