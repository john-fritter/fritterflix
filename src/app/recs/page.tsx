import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";

export default async function RecsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const candidateCount = await prisma.wheelCandidate.count();

  return (
    <main className="shell">
      <Header user={user} activePage="recs" candidateCount={candidateCount} />
      <div className="recs-placeholder">
        <p>Recommendations coming soon.</p>
      </div>
    </main>
  );
}
