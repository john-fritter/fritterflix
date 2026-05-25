import Link from "next/link";

interface HeaderProps {
  user: string;
  activePage: "movies" | "wheel" | "recs";
  candidateCount?: number;
}

export function Header({ user, activePage, candidateCount = 0 }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <Link href="/movies" className="brand-link">
          <h1>Fritterflix</h1>
        </Link>
        <p>Signed in as {user}.</p>
      </div>
      <nav className="header-nav">
        <Link href="/movies" className={`nav-link${activePage === "movies" ? " active" : ""}`}>
          Movies
        </Link>
        <a href="/wheel" className={`nav-link${activePage === "wheel" ? " active" : ""}`}>
          Wheel{candidateCount > 0 ? ` (${candidateCount})` : ""}
        </a>
        <a href="/recs" className={`nav-link${activePage === "recs" ? " active" : ""}`}>
          Recs
        </a>
        <form action="/api/auth/logout" method="post">
          <button className="logout" type="submit">Logout</button>
        </form>
      </nav>
    </header>
  );
}
