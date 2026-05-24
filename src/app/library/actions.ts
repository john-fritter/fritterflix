"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseRating(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const rating = Number(raw);
  if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
    throw new Error("Ratings must be between 0 and 10.");
  }

  return rating.toFixed(1);
}

export async function updateMovieRating(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const jellyfinItemId = String(formData.get("jellyfinItemId") ?? "").trim();
  if (!jellyfinItemId) throw new Error("Missing Jellyfin item id.");

  await prisma.movieRating.upsert({
    where: { jellyfinItemId },
    create: {
      jellyfinItemId,
      johnRating: parseRating(formData.get("johnRating")),
      airaRating: parseRating(formData.get("airaRating"))
    },
    update: {
      johnRating: parseRating(formData.get("johnRating")),
      airaRating: parseRating(formData.get("airaRating"))
    }
  });

  revalidatePath("/library");
  revalidatePath(`/movies/${jellyfinItemId}`);
}

export async function toggleWheelCandidate(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const jellyfinItemId = String(formData.get("jellyfinItemId") ?? "").trim();
  if (!jellyfinItemId) throw new Error("Missing Jellyfin item id.");

  const title = String(formData.get("title") ?? "").trim();
  const poster = String(formData.get("poster") ?? "").trim() || null;

  const existing = await prisma.wheelCandidate.findUnique({ where: { jellyfinItemId } });

  if (existing) {
    await prisma.wheelCandidate.delete({ where: { jellyfinItemId } });
  } else {
    await prisma.wheelCandidate.create({ data: { jellyfinItemId, title, poster } });
  }

  revalidatePath("/library");
  revalidatePath("/wheel");
}
