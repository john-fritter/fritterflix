"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function removeWheelCandidate(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const jellyfinItemId = String(formData.get("jellyfinItemId") ?? "").trim();
  if (!jellyfinItemId) throw new Error("Missing Jellyfin item id.");

  await prisma.wheelCandidate.delete({ where: { jellyfinItemId } });

  revalidatePath("/wheel");
  revalidatePath("/library");
}
