import { ObjectId } from 'mongoose';
export interface NoteDocument {
  _id: string; // Change from ObjectId to string since lean() converts it
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  __v: number;
}