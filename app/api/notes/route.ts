import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/note.js';
import { encryptNote, decryptNote } from '@/lib/encrypt';

// POST: Create a new note
export async function POST(req: NextRequest) {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && !req.headers.get('x-forwarded-proto')?.startsWith('https')) {
    return NextResponse.json({ message: 'HTTPS required' }, { status: 403 });
  }

  await dbConnect();

  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    const note = new Note({ title, content: 'temp' }); // Temporary content to generate ID
    const encryptedContent = encryptNote(content, note._id.toString());
    note.content = encryptedContent;
    await note.save();
    console.log('Saving note to MongoDB:', { title, encryptedContent });

    const savedNote = await Note.findById(note._id).lean();
    savedNote.content = decryptNote(savedNote.content, savedNote._id.toString());
    return NextResponse.json(savedNote, { status: 201 });
  } catch (error) {
    console.error('Create note error:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// GET: Fetch all notes
export async function GET(req: NextRequest) {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && !req.headers.get('x-forwarded-proto')?.startsWith('https')) {
    return NextResponse.json({ message: 'HTTPS required' }, { status: 403 });
  }

  await dbConnect();

  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    console.log('Fetched notes from MongoDB:', notes.length);

    const decryptedNotes = notes.map((note) => {
      try {
        const decryptedContent = decryptNote(note.content, note._id.toString());
        return {
          id: note._id.toString(),
          title: note.title,
          content: decryptedContent,
          createdAt: note.createdAt,
        };
      } catch (err) {
        console.error(`Decryption error for note ${note._id}:`, err);
        return {
          id: note._id.toString(),
          title: note.title,
          content: 'Decryption failed',
          createdAt: note.createdAt,
        };
      }
    });

    return NextResponse.json(decryptedNotes, { status: 200 });
  } catch (error) {
    console.error('Fetch notes error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}