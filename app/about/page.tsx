export default function About() {
  return (
    <div className="landing-container">
      <main className="main-content">
        <h1 className="about-title">About Secure Notes</h1>
        <p className="description">
          Secure Notes is built to keep your private thoughts safe with AES-256 encryption.
          <br />
          Designed for simplicity and security, it’s your go-to for confidential note-taking.
          <br />
          Created with love{" "}
          <a
            href="https://github.com/your-github-username"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
          >
            @shridhar
          </a>
        </p>
      </main>
    </div>
  );
}
