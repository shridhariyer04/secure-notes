"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import "./Signin.css";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      window.location.href = "/notes"; // Redirect to notes page on success
    }
  };

  return (
    <div className="signin-container">
      <main className="signin-content">
        <div className="signin-card">
          <h1 className="signin-title">Sign In</h1>
          <p className="signin-subtitle">SECURE. PRIVATE. YOURS.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="signin-button">
              Sign In
            </button>
            
            <div className="forgot-password">
              <Link href="/auth/forgot-password">Forgot Password?</Link>
            </div>
          </form>
          
          <div className="signup-link-container">
            Don&apos;t have an account?
            <Link href="/auth/signup" className="signup-link">Sign Up</Link>
          </div>
        </div>
      </main>
    </div>
  );
}