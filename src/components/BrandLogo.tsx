import logoClaro from '@/assets/logotipo-principal-variacao-clara-956e5.png'
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={cn('h-10 w-10', className)} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 4C14.1 4 6 12.1 6 22v4c0 9.9 8.1 18 18 18s18-8.1 18-18v-4C42 12.1 33.9 4 24 4Z"
        stroke="currentColor"
        strokeWidth="2.6"
      />
      <path d="M7 24h34" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M24 12v24M24 16c-5-5-10-2-10-2 2 5 6 6 10 5m0-3c5-5 10-2 10-2-2 5-6 6-10 5m0 14-5 5m5-5 5 5m-5-8-3 3m3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface BrandLogoProps {
  className?: string
  compact?: boolean
}

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  if (compact) {
    return (
      <div
        className={cn('inline-flex items-center gap-2 text-[#1F3864]', className)}
        aria-label="Pílulas de Desenvolvimento"
      >
        <BrandMark className="h-9 w-9 text-[#6E9B1F]" />
        <span className="hidden text-[15px] font-bold leading-tight min-[420px]:block">
          Pílulas de
          <br />
          Desenvolvimento
        </span>
      </div>
    )
  }

  return (
    <img
      src={logoClaro}
      alt="Pílulas de Desenvolvimento"
      className={cn('h-auto w-full object-contain', className)}
    />
  )
}
