"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function removeWheelCandidate(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing id.");

  await prisma.wheelCandidate.delete({ where: { id } });

  revalidatePath("/wheel");
  revalidatePath("/movies");
}
