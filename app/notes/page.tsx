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
  const { status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  // Start editing a note
  const handleEditStart = (note: Note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setTitle("");
    setContent("");
    setIsEditing(false);
  };

  // Update a note
  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!editingNoteId) return;

    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingNoteId, title, content }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update note");
      }
      const updatedNote = await res.json();
      console.log("Note updated:", updatedNote);
      
      setNotes(notes.map(note => 
        note.id === editingNoteId ? {...updatedNote, createdAt: note.createdAt} : note
      ));
      
      setEditingNoteId(null);
      setTitle("");
      setContent("");
      setIsEditing(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update note";
      setError(errorMessage);
    }
  };

  // Delete a note
  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete note");
      }
      console.log("Note deleted:", id);
      setNotes(notes.filter(note => note.id !== id));
      setConfirmDelete(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete note";
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
            <form 
              onSubmit={isEditing ? handleUpdateNote : handleCreateNote} 
              className="note-form space-y-6"
            >
              <div className="input-wrapper">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  required
                  className="input-field title-input dark p-4 text-lg placeholder-gray-400 focus:bg-white/15 w-full bg-white/5 border border-white/10 rounded-lg outline-none transition-all duration-300"
                />
              </div>
              <div className="input-wrapper">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts here..."
                  required
                  className="input-field content-input dark p-4 text-lg h-40 resize-none placeholder-gray-400 focus:bg-white/15 w-full bg-white/5 border border-white/10 rounded-lg outline-none transition-all duration-300"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`btn create-button dark flex-1 py-3 text-xl font-semibold rounded-lg border border-white/10 transition-all duration-300 ${
                    isEditing 
                      ? "bg-indigo-600/70 hover:bg-indigo-500/70 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                      : "bg-gradient-to-r from-purple-700/70 to-indigo-700/70 hover:from-purple-600/70 hover:to-indigo-600/70 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                  }`}
                >
                  <span className="btn-text">{isEditing ? "Update Note" : "Save Note"}</span>
                </button>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn cancel-button dark bg-gray-800/70 border border-white/10 py-3 px-6 text-xl font-semibold rounded-lg hover:bg-gray-700/70 transition-all duration-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="notes-section dark mt-10">
            <div className="notes-header flex justify-between items-center mb-6">
              <h2 className="notes-title text-2xl font-bold text-white">Your Notes</h2>
              <div className="notes-count text-gray-400">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="empty-state text-center py-16 bg-white/5 rounded-xl border border-white/10">
                <div className="empty-icon text-4xl mb-4">📝</div>
                <p className="empty-text text-gray-300">Your thoughts are waiting to be captured</p>
              </div>
            ) : (
              <ul className="notes-list space-y-5 max-h-96 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="note-card dark bg-white/5 rounded-xl border border-white/10 overflow-hidden group transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    <div className="p-5">
                      <h3 className="note-title text-xl font-semibold text-white">{note.title || "Untitled"}</h3>
                      <p className="note-content text-gray-300 mt-3 leading-relaxed">{note.content || "No content"}</p>
                    </div>
                    
                    <div className="note-footer px-5 py-3 flex justify-between items-center border-t border-white/10 bg-black/20">
                      <span className="note-date text-gray-400 text-sm">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Unknown date"}
                      </span>
                      
                      <div className="note-actions flex items-center space-x-1">
                        {confirmDelete === note.id ? (
                          <div className="delete-confirm flex items-center bg-black/30 rounded-lg overflow-hidden border border-white/10">
                            <span className="text-xs text-red-300 px-2">Delete?</span>
                            <button 
                              onClick={() => handleDeleteNote(note.id)}
                              className="confirm-yes bg-red-900/50 text-white px-3 py-1 hover:bg-red-800/50 transition-colors"
                              title="Yes, delete"
                            >
                              Yes
                            </button>
                            <button 
                              onClick={() => setConfirmDelete(null)}
                              className="confirm-no bg-gray-800/50 text-white px-3 py-1 hover:bg-gray-700/50 transition-colors"
                              title="Cancel"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEditStart(note)}
                              className="edit-btn h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-300 hover:border-indigo-500/30 transition-all duration-300"
                              title="Edit note"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                <path d="m15 5 4 4"></path>
                              </svg>
                            </button>
                            <button 
                              onClick={() => setConfirmDelete(note.id)}
                              className="delete-btn h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/30 transition-all duration-300"
                              title="Delete note"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
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