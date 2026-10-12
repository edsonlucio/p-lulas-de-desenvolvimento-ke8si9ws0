import { BookOpenCheck, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  description,
  actionLabel = 'Novo Curso',
  onAction,
}: {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD3C3] bg-white/70 px-6 py-12 text-center">
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#EAF0DF] text-[#6E9B1F]">
        <div className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-[#1F3864]/10" />
        <BookOpenCheck className="h-9 w-9" />
      </div>
      <h3 className="text-lg font-bold text-[#1F3864]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm font-medium text-[#5A6B7E]">{description}</p>
      ) : null}
      {onAction ? (
        <Button
          onClick={onAction}
          className="mt-5 rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
        >
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
