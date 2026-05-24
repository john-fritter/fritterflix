import { redirect } from "next/navigation";
import { setSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (!verifyPassword("admin", password)) {
    redirect("/login?error=1");
  }

  await setSession("admin");
  redirect("/library");
}
