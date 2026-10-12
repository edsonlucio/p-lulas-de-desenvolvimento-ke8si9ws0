import { cn } from '@/lib/utils'
import type { CourseStatus } from '@/types/backoffice'

export function StatusBadge({ status, className }: { status: CourseStatus; className?: string }) {
  const active = status === 'ativo'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm',
        active ? 'bg-[#6E9B1F] text-white' : 'bg-[#E4E6E3] text-[#1F3864]',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'animate-soft-pulse bg-white' : 'bg-[#718096]',
        )}
      />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}
