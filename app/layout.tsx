import Link from 'next/link';
import "./globals.css"; // Ensure this import is here!

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="nav-content">
            <Link href="/" className="nav-title">Secure Notes</Link>
            <div className="nav-links">
              <Link href="/about" className="nav-link">About</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}