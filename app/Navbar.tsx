'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="navbar">
      <div className="nav-content">
        <Link href="/" className="nav-title">Secure Notes</Link>
        <div className="nav-links">
          <Link href="/about" className="nav-link">About</Link>
          {status === "loading" ? (
            <span className="nav-link">Loading...</span>
          ) : session ? (
            <>
              <span className="nav-link">Welcome, {session.user.name}</span>
              <Link href="/api/auth/signout" className="nav-link">Sign Out</Link>
            </>
          ) : (
            <Link href="/auth/signin" className="nav-link">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}