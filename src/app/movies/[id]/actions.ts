"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveStarRating(
  movieId: string,
  field: "johnRating" | "airaRating",
  value: number | null
) {
  const user = await currentUser();
  if (!user) redirect("/login");

  if (value !== null && (!Number.isInteger(value) || value < 1 || value > 10)) {
    throw new Error("Invalid rating value.");
  }

  await prisma.movieRating.upsert({
    where: { movieId },
    create: {
      movieId,
      johnRating: field === "johnRating" ? value : undefined,
      airaRating: field === "airaRating" ? value : undefined,
    },
    update: {
      johnRating: field === "johnRating" ? value : undefined,
      airaRating: field === "airaRating" ? value : undefined,
    },
  });

  revalidatePath(`/movies/${movieId}`);
  revalidatePath("/movies");
}
