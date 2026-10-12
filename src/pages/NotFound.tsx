import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/BrandLogo'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F5F3] px-5 font-quicksand">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EAF0DF] text-[#6E9B1F]">
          <Compass className="h-9 w-9" />
        </div>
        <div className="mt-7 flex items-center justify-center gap-2">
          <BrandMark className="h-8 w-8 text-[#6E9B1F]" />
          <span className="text-sm font-bold text-[#1F3864]">Pílulas de Desenvolvimento</span>
        </div>
        <h1 className="mt-6 text-6xl font-bold text-[#1F3864]">404</h1>
        <h2 className="mt-3 text-xl font-bold text-[#1F3864]">Página não encontrada</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#5A6B7E]">
          O endereço pode estar incorreto ou a página pode ter sido movida.
        </p>
        <Button
          asChild
          className="mt-6 h-11 rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </main>
  )
}
