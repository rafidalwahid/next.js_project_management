import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import UserProfileClient from "./page.client";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // In server components, we need to await params in Next.js 14
  const { id } = await params;

  // Check if the user is requesting their own profile or has admin rights
  const isOwnProfile = session.user.id === id;
  const isAdmin = session.user.role === "admin";

  // For debugging
  console.log('Server: Session user ID:', session.user.id);
  console.log('Server: Requested profile ID:', id);
  console.log('Server: Is own profile:', isOwnProfile);
  console.log('Server: Is admin:', isAdmin);

  if (!isOwnProfile && !isAdmin) {
    redirect("/dashboard");
  }

  // Get initial user data
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!user) {
    // Handle user not found
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p className="text-muted-foreground">
          The user profile you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  // Pass the initial data to the client component
  return <UserProfileClient userId={id} initialUser={user} />;
}
