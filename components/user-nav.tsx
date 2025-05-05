"use client"

import { cn } from "@/lib/utils"
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
import { LogOut, User } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { checkOutAndLogout } from "@/lib/logout-utils"

interface UserNavProps {
  compact?: boolean
  showName?: boolean
  className?: string
}

export function UserNav({ compact = false, showName = true, className }: UserNavProps) {
  const { data: session } = useSession()
  const user = session?.user

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "AU"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-8 w-full",
            compact ? "px-2" : "px-3",
            className
          )}
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image} alt={user?.name ?? ""} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>

            {showName && (
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none">
                  {user?.name || "Admin User"}
                </span>
                <span className="text-xs text-muted-foreground leading-none mt-1">
                  {user?.role || "Admin"}
                </span>
              </div>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || "Admin User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "admin@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/profile/${session?.user?.id}`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => checkOutAndLogout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
