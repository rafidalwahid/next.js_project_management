"use client"

import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/team/user-card"

interface User {
  id: string
  name: string | null
  email: string
  image?: string | null
  role: string
  createdAt?: string
}

interface UserGridProps {
  users: User[]
  onDelete: (userId: string) => void
}

export function UserGrid({ users, onDelete }: UserGridProps) {
  if (users.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Users Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            No users match your current search criteria or filters. Try adjusting your search terms or filter settings.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} onDelete={onDelete} />
      ))}
    </div>
  )
}
