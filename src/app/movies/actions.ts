"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleWheelCandidate(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const source = String(formData.get("source") ?? "").trim();
  const externalId = String(formData.get("externalId") ?? "").trim();
  if (!source || !externalId) throw new Error("Missing source or externalId.");

  const title = String(formData.get("title") ?? "").trim();
  const poster = String(formData.get("poster") ?? "").trim() || null;

  const existing = await prisma.wheelCandidate.findUnique({
    where: { source_externalId: { source, externalId } },
  });

  if (existing) {
    await prisma.wheelCandidate.delete({ where: { id: existing.id } });
  } else {
    await prisma.wheelCandidate.create({ data: { source, externalId, title, poster } });
  }

  revalidatePath("/movies");
  revalidatePath("/wheel");
}

export async function hideFromRecent(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const jellyfinItemId = String(formData.get("jellyfinItemId") ?? "").trim();
  if (!jellyfinItemId) throw new Error("Missing jellyfinItemId.");

  await prisma.movieRating.upsert({
    where: { jellyfinItemId },
    create: { jellyfinItemId, hiddenFromRecent: true },
    update: { hiddenFromRecent: true },
  });

  revalidatePath("/movies");
}
