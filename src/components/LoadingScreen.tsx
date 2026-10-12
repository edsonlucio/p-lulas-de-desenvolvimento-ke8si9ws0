import { BrandMark } from '@/components/BrandLogo'

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F5F3]">
      <div className="flex flex-col items-center gap-4 text-[#1F3864]">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#6E9B1F]/20" />
          <BrandMark className="relative h-14 w-14 text-[#6E9B1F]" />
        </div>
        <p className="text-sm font-semibold">Preparando seu espaço...</p>
      </div>
    </div>
  )
}
