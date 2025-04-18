import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-container">
      <header className="header">
        <h1 className="title">Secure Notes</h1>
        <p className="subtitle">Privacy-first note-taking.</p>
      </header>
      <main className="main-content">
        <p className="description">
          Keep your thoughts safe with AES-256 encryption. Start now.
        </p>
        <div className="cta-buttons">
          <Link href="/auth/signup">
            <button className="btn">Sign Up</button>
          </Link>
          <Link href="/auth/signin">
            <button className="btn secondary">Login</button>
          </Link>
        </div>
      </main>
    </div>
  );
}
