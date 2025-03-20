import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || ''; // Ensure it's always a string

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables');
}

export function getUserFromToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
