import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/note.js'; // Should already be correct

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const userEmail = req.headers.get('x-user-email'); // From middleware
    const { id } = params;

    if (!userEmail) {
      return NextResponse.json({ message: 'User email not found' }, { status: 401 });
    }

    const note = await Note.findOne({ _id: id, userEmail });
    if (!note) {
      return NextResponse.json({ message: 'Note not found or not authorized' }, { status: 404 });
    }

    await Note.deleteOne({ _id: id });
    return NextResponse.json({ message: 'Note deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}