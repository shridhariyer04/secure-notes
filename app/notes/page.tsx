"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function Notes() {
  const { status } = useSession(); // Only destructure status since session isn't used
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load notes
  useEffect(() => {
    if (status === "authenticated") {
      const loadNotes = async () => {
        try {
          const res = await fetch("/api/notes");
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to fetch notes");
          }
          const data = await res.json();
          console.log("Fetched notes data:", data);
          setNotes(data);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch notes";
          setError(errorMessage);
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      };
      loadNotes();
    }
  }, [status]);

  // Create a new note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create note");
      }
      const newNote = await res.json();
      console.log("New note created:", newNote);
      setNotes([newNote, ...notes]);
      setTitle("");
      setContent("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create note";
      setError(errorMessage);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="landing-container">
        <div className="loader">
          <div className="loading-text">Loading notes</div>
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-container">
        <div className="error-container">
          <div className="error-icon">!</div>
          <div className="error-message">{error}</div>
          <button onClick={() => window.location.reload()} className="btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container bg-gradient-to-br from-black via-gray-900 to-black min-h-screen flex items-center justify-center">
      <div className="glass-container dark p-8 max-w-3xl w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl">
        <div className="header-area mb-6">
          <h1 className="title text-5xl text-white drop-shadow-lg">Encrypted Notes</h1>
          <p className="subtitle text-gray-300 text-lg">Secure. Private. Yours.</p>
        </div>

        <div className="notes-layout">
          <div className="form-section">
            <form onSubmit={handleCreateNote} className="note-form space-y-6">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  required
                  className="input-field title-input dark p-4 text-lg placeholder-gray-400 focus:bg-white/15 w-full"
                />
              </div>
              <div className="input-wrapper">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts here..."
                  required
                  className="input-field content-input dark p-4 text-lg h-40 resize-none placeholder-gray-400 focus:bg-white/15 w-full"
                />
              </div>
              <button
                type="submit"
                className="btn create-button dark w-full py-3 text-xl font-semibold hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-300"
              >
                <span className="btn-icon">+</span>
                <span className="btn-text">Save Note</span>
              </button>
            </form>
          </div>

          <div className="notes-section dark mt-8">
            <div className="notes-header flex justify-between items-center mb-4">
              <h2 className="notes-title text-2xl font-bold text-white">Your Notes</h2>
              <div className="notes-count text-gray-400">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="empty-state text-center py-10">
                <div className="empty-icon text-4xl mb-4">📝</div>
                <p className="empty-text text-gray-300">Your thoughts are waiting to be captured</p>
              </div>
            ) : (
              <ul className="notes-list space-y-6 max-h-96 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="note-card dark bg-white/10 p-5 rounded-lg border border-white/20 hover:bg-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-1"
                  >
                    <h3 className="note-title text-xl font-semibold text-white">{note.title || "Untitled"}</h3>
                    <p className="note-content text-gray-200 mt-2 leading-relaxed">{note.content || "No content"}</p>
                    <div className="note-footer mt-3">
                      <span className="note-date text-gray-400">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Unknown date"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}