import { cache } from "react";
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

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: user.id,
    },
  });

  return profile;
});

export async function requireAdmin() {
  const user = await requireUser();

  let profile = await prisma.profile.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email || "",
        role: "user",
      },
    });
  }

  if (profile.role !== "admin") {
    redirect("/unauthorized");
  }

  return profile;
}
