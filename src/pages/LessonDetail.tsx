import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Play,
  PlayCircle,
  BookOpen,
  Edit3,
  CheckCircle2,
  Share2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { LessonChatWidget } from '@/components/lessons/LessonChatWidget'
import { LessonFormDialog } from '@/components/lessons/LessonFormDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useToast } from '@/hooks/use-toast'
import { getYouTubeEmbedUrl } from '@/lib/youtube'
import { canEditLesson } from '@/lib/roles'
import { cn } from '@/lib/utils'

export default function LessonDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { courses, lessons, loading, refreshLessons } = useBackoffice()
  const { toast } = useToast()

  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // A aula atual
  const currentLesson = useMemo(() => lessons.find((item) => item.id === id), [lessons, id])

  // O curso pertencente
  const course = useMemo(() => {
    if (!currentLesson) return null
    return courses.find((c) => c.id === currentLesson.course) ?? null
  }, [courses, currentLesson])

  // Aulas do mesmo curso ordenadas por `order`
  const courseLessons = useMemo(() => {
    if (!currentLesson) return []
    return lessons
      .filter((l) => l.course === currentLesson.course)
      .sort((a, b) => a.order - b.order)
  }, [lessons, currentLesson])

  // Índice da aula atual na lista ordenada
  const currentIndex = useMemo(() => {
    if (!currentLesson) return -1
    return courseLessons.findIndex((l) => l.id === currentLesson.id)
  }, [courseLessons, currentLesson])

  const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex >= 0 && currentIndex < courseLessons.length - 1
      ? courseLessons[currentIndex + 1]
      : null

  const embedUrl = useMemo(
    () => getYouTubeEmbedUrl(currentLesson?.video_url),
    [currentLesson?.video_url],
  )

  const canEdit = canEditLesson(user)

  // Rolar para o topo ao trocar de aula
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-[1300px] space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="aspect-video w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    )
  }

  if (!currentLesson) {
    return (
      <div className="mx-auto max-w-[1000px] py-12">
        <EmptyState
          title="Aula não encontrada"
          description="Esta aula pode ter sido removida ou o endereço está incorreto."
          actionLabel="Voltar para a lista de aulas"
          onAction={() => navigate('/aulas')}
        />
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: 'Link copiado!',
        description: 'O link desta aula foi copiado para sua área de transferência.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 pb-16 font-quicksand">
      {/* 3. TOPO DA TELA: Nome do curso com link de volta e botões de navegação anterior/próxima */}
      <header className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(31,56,100,.06)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={course ? `/cursos/${course.id}` : '/cursos'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F5F3] text-[#1F3864] transition hover:bg-[#EAF0DF] hover:text-[#6E9B1F]"
            title={course ? `Voltar ao curso: ${course.title}` : 'Voltar aos cursos'}
            aria-label="Voltar para o curso"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6E9B1F]">Curso</p>
            <Link
              to={course ? `/cursos/${course.id}` : '/cursos'}
              className="block truncate font-bold text-[#1F3864] transition hover:text-[#6E9B1F]"
            >
              {course?.title || 'Curso'}
            </Link>
          </div>
        </div>

        {/* Controles de Navegação entre Aulas */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="mr-2 hidden text-xs font-semibold text-[#718096] md:inline">
            Aula {currentIndex >= 0 ? currentIndex + 1 : 1} de {courseLessons.length}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!prevLesson}
            onClick={() => prevLesson && navigate(`/aulas/${prevLesson.id}`)}
            className="h-10 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] hover:bg-[#F4F5F3] disabled:opacity-40"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Aula anterior</span>
            <span className="sm:hidden">Anterior</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!nextLesson}
            onClick={() => nextLesson && navigate(`/aulas/${nextLesson.id}`)}
            className="h-10 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] hover:bg-[#F4F5F3] disabled:opacity-40"
          >
            <span className="hidden sm:inline">Próxima aula</span>
            <span className="sm:hidden">Próxima</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 1. PLAYER DE VÍDEO CENTRALIZADO NO TOPO DENTRO DE CARD COM CANTOS ARREDONDADOS E SOMBRA SUAVE */}
      <section className="overflow-hidden rounded-3xl bg-white p-3 shadow-[0_8px_30px_rgba(31,56,100,.10)] sm:p-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0F1E33] shadow-inner">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={currentLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            /* Placeholder elegante com ícone de play e mensagem exata "Vídeo em breve" */
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#172E43] via-[#1F3864] to-[#14293D] p-6 text-center text-white">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,.25)] ring-8 ring-white/5 transition duration-300 hover:scale-105">
                <Play className="ml-1 h-10 w-10 text-[#A8D052]" fill="#A8D052" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Vídeo em breve
              </h3>
              <p className="mt-2 max-w-md text-sm font-medium text-white/70">
                O conteúdo audiovisual desta aula está em produção pela equipe da Pílulas de
                Desenvolvimento.
              </p>
              {canEdit && (
                <Button
                  onClick={() => setEditDialogOpen(true)}
                  className="mt-6 h-10 rounded-xl bg-[#6E9B1F] px-4 font-bold text-white hover:bg-[#5C8619]"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Adicionar link do YouTube
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. ABAIXO DO VÍDEO: TÍTULO DA AULA E DESCRIÇÃO CURTA COM METADADOS */}
      <section className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(31,56,100,.08)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF0DF] px-3 py-1 text-xs font-bold text-[#6E9B1F]">
                <PlayCircle className="h-3.5 w-3.5" />
                Aula {currentLesson.order}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4F5F3] px-3 py-1 text-xs font-bold text-[#5A6B7E]">
                <Clock3 className="h-3.5 w-3.5" />
                {currentLesson.duration_min} min de conteúdo
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1F3864] sm:text-3xl">
              {currentLesson.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
                className="h-10 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864]"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Editar aula
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-10 w-10 rounded-xl text-[#5A6B7E] hover:bg-[#F4F5F3]"
              title="Compartilhar aula"
              aria-label="Compartilhar link da aula"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Descrição Curta */}
        <div className="mt-6 border-t border-[#EDF0EA] pt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E9B1F]">
            Sobre esta aula
          </h2>
          <div className="mt-3 text-[15px] font-medium leading-relaxed text-[#44546A]">
            {currentLesson.description ? (
              <p className="whitespace-pre-line">{currentLesson.description}</p>
            ) : (
              <p className="italic text-[#718096]">
                Nenhuma descrição informada para esta aula ainda.
              </p>
            )}
          </div>
        </div>

        {/* Benefícios / Destaques da metodologia */}
        <div className="mt-8 grid gap-3 rounded-2xl bg-[#F8F9F7] p-4 sm:grid-cols-3 sm:p-5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6E9B1F]" />
            <p className="text-xs font-semibold text-[#1F3864]">
              Metodologia prática e direta ao ponto
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6E9B1F]" />
            <p className="text-xs font-semibold text-[#1F3864]">
              Aplicação imediata na rotina profissional
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6E9B1F]" />
            <p className="text-xs font-semibold text-[#1F3864]">
              Tire dúvidas diretamente no chat flutuante
            </p>
          </div>
        </div>
      </section>

      {/* Playlist lateral / grade rápida das outras aulas do mesmo curso */}
      {courseLessons.length > 1 && (
        <section className="rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(31,56,100,.06)] sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#6E9B1F]" />
              <h2 className="text-lg font-bold text-[#1F3864]">
                Outras aulas deste curso ({courseLessons.length})
              </h2>
            </div>
            {course && (
              <Link
                to={`/cursos/${course.id}`}
                className="text-xs font-bold text-[#6E9B1F] hover:underline"
              >
                Ver grade completa
              </Link>
            )}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {courseLessons.map((item, idx) => {
              const isSelected = item.id === currentLesson.id
              return (
                <Link
                  key={item.id}
                  to={`/aulas/${item.id}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-3 transition border',
                    isSelected
                      ? 'border-[#6E9B1F] bg-[#F1F5EA] text-[#1F3864]'
                      : 'border-[#EDF0EA] bg-[#FDFDFD] hover:border-[#6E9B1F]/40 hover:bg-[#F8F9F7]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      isSelected ? 'bg-[#6E9B1F] text-white' : 'bg-[#EDF0EA] text-[#5A6B7E]',
                    )}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-xs font-bold',
                        isSelected ? 'text-[#1F3864]' : 'text-[#44546A]',
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="text-[11px] font-medium text-[#718096]">
                      {item.duration_min} min
                    </p>
                  </div>
                  {isSelected && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#6E9B1F]">
                      Assistindo
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 4. WIDGET DE CHAT DE DÚVIDAS FLUTUANTE NO CANTO INFERIOR DIREITO */}
      <LessonChatWidget lessonId={currentLesson.id} lessonTitle={currentLesson.title} />

      {/* Modal de Edição de Aula para quem tem permissão */}
      <LessonFormDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) void refreshLessons()
        }}
        lesson={currentLesson}
        courses={courses}
      />
    </div>
  )
}
