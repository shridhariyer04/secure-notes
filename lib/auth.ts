import NextAuth, { NextAuthOptions, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from './db';
import User from '../models/user';
import { compare } from 'bcryptjs';

interface UserForAuth {
  id: string;
  name: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<UserForAuth | null> {
        await dbConnect();

        if (!credentials?.username || !credentials?.password) {
          console.log('Authorize failed: Missing credentials');
          throw new Error('Please provide both username and password');
        }

        console.log(`Looking for user: ${credentials.username}`);
        const user = await User.findOne({ username: credentials.username });

        if (!user) {
          console.log(`Authorize failed: No user found for '${credentials.username}'`);
          throw new Error('No user found with this username');
        }

        const isValid = await compare(credentials.password, user.password);
        console.log(`Password valid for '${credentials.username}': ${isValid}`);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return { id: user._id.toString(), name: user.username };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // `user` is the object returned by `authorize` (UserForAuth in this case)
      if (user) {
        token.id = user.id; // Add the user id to the token
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string; // Now TypeScript knows `id` exists on `session.user`
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);