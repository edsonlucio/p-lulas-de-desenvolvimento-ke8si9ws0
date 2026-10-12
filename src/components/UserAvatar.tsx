import { UserRound } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserAvatarUrl } from '@/services/auth'
import type { UserRecord } from '@/types/backoffice'
import { cn } from '@/lib/utils'

export function getInitials(name?: string) {
  const words = (name || 'Usuário').trim().split(/\s+/)
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function UserAvatar({ user, className }: { user: UserRecord | null; className?: string }) {
  const url = getUserAvatarUrl(user)
  return (
    <Avatar className={cn('h-10 w-10 border-2 border-white shadow-sm', className)}>
      {url ? <AvatarImage src={url} alt={user?.name || 'Avatar'} /> : null}
      <AvatarFallback className="bg-[#EAF0DF] font-bold text-[#1F3864]">
        {user?.name ? getInitials(user.name) : <UserRound className="h-5 w-5" />}
      </AvatarFallback>
    </Avatar>
  )
}
