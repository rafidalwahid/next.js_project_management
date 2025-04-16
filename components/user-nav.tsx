"use client"

import Link from "next/link"
import { CreditCard, LogOut, Settings, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserNavProps {
  compact?: boolean;
  showName?: boolean;
}

export function UserNav({ compact = false, showName = false }: UserNavProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";

    const nameParts = session.user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return nameParts[0].substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 rounded-full ring-1 ring-black overflow-hidden">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">...</AvatarFallback>
          </Avatar>
        </div>
        {showName && <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>}
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="rounded-full ring-1 ring-black p-0 h-9 w-9 hover:ring-primary hover:ring-2 transition-all">
            <User className="h-4 w-4 text-primary" />
          </Button>
        </Link>
        {showName && (
          <Link href="/login" className="text-sm font-medium">
            Login
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-1 ring-black hover:ring-primary hover:ring-2 transition-all">
            <Avatar className="h-9 w-9">
              {session.user.image ? (
                <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getUserInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align={compact ? "center" : "end"} forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    {showName && (
      <div className="flex flex-col">
        <span className="text-sm font-medium truncate max-w-[120px] text-foreground">
          {session.user.name?.split(' ')[0] || 'User'}
        </span>
        <span className="text-xs text-muted-foreground">Admin</span>
      </div>
    )}
  </div>
  )
}
