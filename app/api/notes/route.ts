import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NoteModel from '@/models/note.js';
import { encryptNote, decryptNote } from '@/lib/encrypt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NoteDocument } from '@/types/note';
import { isValidObjectId } from 'mongoose';

interface DecryptedNote {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !req.headers.get('x-forwarded-proto')?.startsWith('https')) {
    return NextResponse.json({ message: 'HTTPS required' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    const note = new NoteModel({
      title,
      content: 'temp',
      userId: session.user.id,
    });
    
    // Fix: Pass only the content to encryptNote
    const encryptedContent = encryptNote(content);
    
    note.content = encryptedContent;
    await note.save();
    console.log('Saving note to MongoDB:', { title, encryptedContent, userId: session.user.id });

    const savedNote = await NoteModel.findById(note._id).lean() as NoteDocument | null;
    if (!savedNote) {
      return NextResponse.json({ message: 'Failed to retrieve saved note' }, { status: 500 });
    }

    // Fix: Pass only one parameter to decryptNote
    savedNote.content = decryptNote(savedNote.content);
    return NextResponse.json(savedNote, { status: 201 });
  } catch (error: unknown) {
    console.error('Create note error:', error);
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Unexpected error occurred' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !req.headers.get('x-forwarded-proto')?.startsWith('https')) {
    return NextResponse.json({ message: 'HTTPS required' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const notes = await NoteModel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean() as NoteDocument[];
    console.log('Fetched notes from MongoDB for user', session.user.id, ':', notes.length);

    const decryptedNotes: DecryptedNote[] = notes.map((note) => {
      try {
        // Fix: Pass only one parameter to decryptNote
        const decryptedContent = decryptNote(note.content);
        return {
          id: note._id.toString(),
          title: note.title,
          content: decryptedContent,
          createdAt: note.createdAt,
        };
      } catch (err) {
        console.error(`Decryption error for note ${note._id.toString()}:`, err);
        return {
          id: note._id.toString(),
          title: note.title,
          content: 'Decryption failed',
          createdAt: note.createdAt,
        };
      }
    });

    return NextResponse.json(decryptedNotes, { status: 200 });
  } catch (error: unknown) {
    console.error('Fetch notes error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Unexpected error occurred' }, { status: 500 });
  }
}

// Handle PUT requests for updating notes
export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !req.headers.get('x-forwarded-proto')?.startsWith('https')) {
    return NextResponse.json({ message: 'HTTPS required' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { id, title, content } = await req.json();
    
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ message: 'Valid note ID is required' }, { status: 400 });
    }
    
    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    // Find the note and verify ownership
    const existingNote = await NoteModel.findById(id);
    if (!existingNote) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    if (existingNote.userId.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Not authorized to edit this note' }, { status: 403 });
    }

    // Encrypt the content and update the note
    const encryptedContent = encryptNote(content);
    
    existingNote.title = title;
    existingNote.content = encryptedContent;
    await existingNote.save();
    
    console.log('Updated note in MongoDB:', { id, title, userId: session.user.id });

    // Return the updated note with decrypted content
    const updatedNote = {
      id: existingNote._id.toString(),
      title: existingNote.title,
      content: content, // Return the original unencrypted content
      createdAt: existingNote.createdAt,
    };

    return NextResponse.json(updatedNote, { status: 200 });
  } catch (error: unknown) {
    console.error('Update note error:', error);
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Unexpected error occurred' }, { status: 500 });
  }
}

// Handle DELETE requests for deleting notes
export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !req.headers.get('x-forwarded-proto')?.startsWith('https')) {
    return NextResponse.json({ message: 'HTTPS required' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  // Extract the note ID from the URL
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  
  if (!id || !isValidObjectId(id)) {
    return NextResponse.json({ message: 'Valid note ID is required' }, { status: 400 });
  }

  try {
    // Find the note and verify ownership
    const note = await NoteModel.findById(id);
    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    if (note.userId.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Not authorized to delete this note' }, { status: 403 });
    }

    // Delete the note
    await NoteModel.deleteOne({ _id: id });
    console.log('Deleted note from MongoDB:', { id, userId: session.user.id });

    return NextResponse.json({ message: 'Note deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Delete note error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Unexpected error occurred' }, { status: 500 });
  }
}