import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      authenticated: !!session,
      session,
    });
  } catch (error) {
    console.error("Error fetching auth status:", error);
    return NextResponse.json(
      { error: "An error occurred while checking authentication status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}