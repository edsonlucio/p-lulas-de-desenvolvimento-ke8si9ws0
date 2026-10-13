import { cn } from '@/lib/utils'
import { getRoleBadgeStyles, ROLE_LABELS, getUserRole } from '@/lib/roles'
import type { UserRole, UserRecord } from '@/types/backoffice'

interface RoleBadgeProps {
  role?: UserRole
  user?: UserRecord | null
  className?: string
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, user, className, size = 'md' }: RoleBadgeProps) {
  const currentRole = role ?? getUserRole(user)
  const styles = getRoleBadgeStyles(currentRole)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-full transition-colors',
        styles.bg,
        styles.text,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className,
      )}
    >
      {ROLE_LABELS[currentRole]}
    </span>
  )
}
