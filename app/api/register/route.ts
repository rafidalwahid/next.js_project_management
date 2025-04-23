import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { z } from "zod";

// For debugging
const DEBUG = true;

// Define validation schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    if (DEBUG) console.log('Registration API called');

    // Parse request body
    let body;
    try {
      body = await req.json();
      if (DEBUG) console.log('Request body:', { ...body, password: body.password ? '[REDACTED]' : undefined });
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request body
    const validationResult = userSchema.safeParse(body);

    if (!validationResult.success) {
      if (DEBUG) console.log('Validation error:', validationResult.error.format());
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        if (DEBUG) console.log('User already exists:', email);
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.error('Database error checking existing user:', dbError);
      return NextResponse.json(
        { error: "Database error while checking user existence" },
        { status: 500 }
      );
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return NextResponse.json(
        { error: "Error processing password" },
        { status: 500 }
      );
    }

    // Create user
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "user", // Default role
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (DEBUG) console.log('User created successfully:', { id: user.id, email: user.email });
      return NextResponse.json({ user }, { status: 201 });
    } catch (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: "Database error while creating user", details: createError instanceof Error ? createError.message : String(createError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred while registering the user", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}