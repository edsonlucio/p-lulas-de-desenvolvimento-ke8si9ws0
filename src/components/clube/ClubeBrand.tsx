import clubeLogoImg from '@/assets/logotipoesbocofonte-e-paleta-de-cores-1ba05.png'
import { cn } from '@/lib/utils'

/**
 * C estilizado vetorial fiel à marca do Clube das Pílulas:
 * Composto por dois arcos orgânicos sobrepostos formando a letra C aberta e dinâmica.
 */
export function ClubeStylizedC({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-10 w-10', className)}
      aria-hidden="true"
    >
      {/* Arco superior: parte superior do C com extremidade afilada à esquerda e espessamento no topo */}
      <path
        d="M 38 33 C 44 24 56 20 68 22 C 78 24 86 31 87 38 C 88 43 83 48 77 47 C 69 46 62 43 54 44 C 47 45 42 41 38 33 Z"
        fill="currentColor"
      />
      {/* Arco inferior: corpo inferior do C mais robusto que se conecta visualmente */}
      <path
        d="M 39 36 C 44 42 46 47 49 53 C 55 64 67 69 79 66 C 85 64 88 71 85 76 C 80 84 68 89 54 87 C 41 85 34 77 37 60 C 38 52 38 43 39 36 Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Marca d'água / selo do "C" estilizado no canto inferior direito da página do Clube
 */
export function ClubeWatermark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed bottom-4 right-4 z-20 select-none text-[#1F3864] opacity-25 dark:text-white dark:opacity-20 transition-opacity',
        className,
      )}
    >
      <ClubeStylizedC className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-sm" />
    </div>
  )
}

/**
 * Banner/Logo oficial do Clube das Pílulas com o C estilizado e wordmark
 * "CLUBE DAS PÍLULAS — uma metanoia diária"
 */
export function ClubeBrandHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-[#0B1524] text-white p-6 sm:p-8 shadow-[0_10px_32px_rgba(11,21,36,.25)]',
        'border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6',
        className,
      )}
    >
      <div className="flex items-center gap-5 sm:gap-7 text-left">
        <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md ring-1 ring-white/20 shadow-inner">
          <ClubeStylizedC className="h-14 w-14 sm:h-16 sm:w-16 text-white" />
        </div>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6E9B1F]/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#A8D052] ring-1 ring-[#6E9B1F]/50">
            Comunidade & Leitura Dirigida
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-white">
            CLUBE DAS PÍLULAS
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#C9D7E8] uppercase">
            uma metanoia diária
          </p>
        </div>
      </div>

      {/* Mini preview do logo oficial recortado */}
      <div className="hidden lg:block shrink-0 opacity-90 max-w-[220px]">
        <img
          src={clubeLogoImg}
          alt="Clube das Pílulas"
          className="h-20 w-auto rounded-xl object-contain brightness-110 drop-shadow-md"
        />
      </div>
    </div>
  )
}
