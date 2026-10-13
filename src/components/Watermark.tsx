import capsuleIcon from '@/assets/icone-variacao-escura-ebe67.png'
import { cn } from '@/lib/utils'

interface WatermarkProps {
  className?: string
}

/**
 * Marca d'água discreta do símbolo da Pílulas (cápsula com árvore e raízes)
 * Posicionada fixa no canto inferior direito de todas as páginas autenticadas.
 * Configurada com opacidade suave, pointer-events-none para nunca atrapalhar cliques ou conteúdos,
 * e posicionamento coordenado com o chat flutuante da aula.
 */
export function Watermark({ className }: WatermarkProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed bottom-4 right-4 z-20 select-none transition-opacity duration-300',
        'opacity-20 hover:opacity-30 dark:opacity-15',
        className,
      )}
    >
      <img
        src={capsuleIcon}
        alt=""
        className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-sm filter dark:invert"
        loading="lazy"
        draggable={false}
      />
    </div>
  )
}
