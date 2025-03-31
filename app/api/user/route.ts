import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, email, password } = await req.json();

    // Validate all required fields
    if (!username || !email || !password) {
      console.log(`Signup failed: Missing fields - username: ${username}, email: ${email}`);
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      const conflictField = existingUser.username === username ? "Username" : "Email";
      console.log(`Signup failed: ${conflictField} '${conflictField === "Username" ? username : email}' already exists`);
      return NextResponse.json(
        { message: `${conflictField} already exists` },
        { status: 400 }
      );
    }

    // Create the new user
    await User.create({
      username,
      email,
      password, // Password is already hashed by the client
    });

    console.log(`User '${username}' created successfully`);
    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error('Error creating user:', errorMessage);
    return NextResponse.json(
      { message: "Error creating user", error: errorMessage },
      { status: 500 }
    );
  }
}