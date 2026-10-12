import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export function ActionState({
  status,
  title,
  description,
  children,
}: {
  status: 'loading' | 'success' | 'error'
  title: string
  description: string
  children?: ReactNode
}) {
  const Icon = status === 'loading' ? Loader2 : status === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div className="py-3 text-center">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${status === 'success' ? 'bg-[#6E9B1F]/12 text-[#5C8A1E]' : status === 'error' ? 'bg-[#C0392B]/10 text-[#C0392B]' : 'bg-[#1F3864]/10 text-[#1F3864]'}`}
      >
        <Icon className={`h-8 w-8 ${status === 'loading' ? 'animate-spin' : ''}`} />
      </div>
      <h2 className="mt-5 text-xl font-bold text-[#1F3864]">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-[#5A6B7E]">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
