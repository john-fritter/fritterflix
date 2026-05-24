import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await currentUser();
  if (user) redirect("/library");
  const params = await searchParams;

  return (
    <main className="login-wrap">
      <section className="login-card">
        <h1>Fritterflix</h1>
        <p>Log in as admin to browse the Jellyfin movie library.</p>
        <form className="form" action="/api/auth/login" method="post">
          {params.error ? <div className="error">Invalid username or password.</div> : null}
          <label className="field">
            User
            <input name="username" value="admin" readOnly />
          </label>
          <label className="field">
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary" type="submit">Log in</button>
        </form>
      </section>
    </main>
  );
}
