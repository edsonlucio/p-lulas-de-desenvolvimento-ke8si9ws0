import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Quote } from 'lucide-react'

import { BrandLogo, BrandMark } from '@/components/BrandLogo'

export function AuthShell({
  children,
  title,
  description,
  compact = false,
}: {
  children: ReactNode
  title: string
  description: string
  compact?: boolean
}) {
  return (
    <main className="grid min-h-screen bg-[#F4F5F3] font-quicksand text-[#1F3864] lg:grid-cols-[.92fr_1.08fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#172E43] via-[#1F3864] to-[#1E3A12] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-32 -top-40 h-[430px] w-[430px] rounded-full border-[80px] border-white/[0.035]" />
        <div className="absolute -bottom-36 -left-28 h-[390px] w-[390px] rounded-full border-[75px] border-[#6E9B1F]/10" />
        <div className="absolute left-[65%] top-[37%] h-32 w-32 rounded-full bg-[#6E9B1F]/10 blur-3xl" />
        <BrandLogo className="relative z-10 max-h-[96px] max-w-[300px] brightness-0 invert" />
        <div className="relative z-10 max-w-xl">
          <Quote className="mb-5 h-9 w-9 text-[#9CC747]" />
          <h2 className="text-3xl font-bold leading-tight xl:text-[40px]">
            Desenvolvimento que começa por dentro e transforma o que está ao redor.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] font-medium leading-7 text-white/65">
            Uma gestão simples e humana para cursos que impulsionam pessoas, líderes e resultados.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-xs font-bold text-white/75">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#9CC747]" />
              Conteúdo organizado
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#9CC747]" />
              Gestão prática
            </span>
          </div>
        </div>
        <p className="relative z-10 text-xs font-semibold text-white/35">
          Natal/RN · Desenvolvimento humano e comportamento estratégico
        </p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className={`w-full ${compact ? 'max-w-md' : 'max-w-[460px]'}`}>
          <Link to="/login" className="mb-9 flex items-center justify-center lg:hidden">
            <BrandMark className="h-12 w-12 text-[#6E9B1F]" />
            <span className="ml-3 text-lg font-bold leading-tight">
              Pílulas de
              <br />
              Desenvolvimento
            </span>
          </Link>
          <div className="animate-fade-in-up rounded-3xl bg-white p-6 shadow-[0_12px_42px_rgba(31,56,100,.09)] sm:p-9">
            <div className="mb-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#6E9B1F]">
                Área administrativa
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#1F3864]">{title}</h1>
              <p className="mt-2 text-sm font-medium leading-6 text-[#5A6B7E]">{description}</p>
            </div>
            {children}
          </div>
          <p className="mt-6 text-center text-xs font-medium text-[#8290A0]">
            © {new Date().getFullYear()} Pílulas de Desenvolvimento
          </p>
        </div>
      </section>
    </main>
  )
}
