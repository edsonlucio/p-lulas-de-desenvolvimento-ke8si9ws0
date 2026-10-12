import type { ReactNode } from 'react'

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="animate-fade-in-down flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6E9B1F]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-[#1F3864] sm:text-[34px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] font-medium text-[#5A6B7E]">{description}</p>
      </div>
      {action}
    </div>
  )
}
