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
  FileSpreadsheet,
  FileText,
  Presentation,
  Download,
  ExternalLink,
  Film,
  Check,
  Sparkles,
  Loader2,
  Heart,
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
import { getLessonFileUrl } from '@/services/lessons'
import { CheckoutModal } from '@/components/courses/CheckoutModal'
import { CertificateDialog } from '@/components/courses/CertificateDialog'
import { getCertificateForCourse, issueCertificate } from '@/services/certificates'
import { isLessonFavorited, toggleFavoriteLesson } from '@/services/favorites'
import { getUserCourseProgress, toggleLessonProgress } from '@/services/progress'
import type { CertificateRecord, LessonProgress } from '@/types/backoffice'
import { cn } from '@/lib/utils'

export default function LessonDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { courses, lessons, loading, refreshLessons, canAccessCourseContent } = useBackoffice()
  const { toast } = useToast()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [certDialogOpen, setCertDialogOpen] = useState(false)
  const [courseCertificate, setCourseCertificate] = useState<CertificateRecord | null>(null)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)

  // Favorito
  const [isFavorited, setIsFavorited] = useState(false)
  const [togglingFavorite, setTogglingFavorite] = useState(false)

  // Progresso do aluno
  const [userProgressList, setUserProgressList] = useState<LessonProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(false)
  const [togglingProgress, setTogglingProgress] = useState(false)

  // Aula atual
  const currentLesson = useMemo(() => lessons.find((item) => item.id === id), [lessons, id])

  // Curso
  const course = useMemo(() => {
    if (!currentLesson) return null
    return courses.find((c) => c.id === currentLesson.course) ?? null
  }, [courses, currentLesson])

  // Aulas do mesmo curso
  const courseLessons = useMemo(() => {
    if (!currentLesson) return []
    return lessons
      .filter((l) => l.course === currentLesson.course)
      .sort((a, b) => a.order - b.order)
  }, [lessons, currentLesson])

  // Carregar progresso do aluno para as aulas deste curso
  useEffect(() => {
    let cancelled = false
    if (!user?.id) return

    setProgressLoading(true)
    getUserCourseProgress(user.id)
      .then((records) => {
        if (!cancelled) {
          setUserProgressList(records)
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar progresso:', err)
      })
      .finally(() => {
        if (!cancelled) setProgressLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Buscar certificado do curso se já tiver sido emitido
  useEffect(() => {
    if (!user?.id || !course?.id) return
    let active = true
    getCertificateForCourse(user.id, course.id)
      .then((cert) => {
        if (active) setCourseCertificate(cert)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user?.id, course?.id])

  // Checar se a aula atual está favoritada pelo usuário
  useEffect(() => {
    if (!user?.id || !currentLesson?.id) return
    let active = true
    isLessonFavorited(user.id, currentLesson.id)
      .then((fav) => {
        if (active) setIsFavorited(fav)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user?.id, currentLesson?.id])

  const handleToggleFavorite = async () => {
    if (!user?.id || !currentLesson?.id || togglingFavorite) return
    setTogglingFavorite(true)
    try {
      const next = await toggleFavoriteLesson(user.id, currentLesson.id)
      setIsFavorited(next)
      toast({
        title: next ? 'Adicionada aos favoritos' : 'Removida dos favoritos',
        description: next
          ? 'Você pode acessar esta aula rapidamente na tela Favoritas.'
          : 'A aula foi removida da sua lista de favoritas.',
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao favoritar',
        description: 'Não foi possível atualizar seus favoritos.',
      })
    } finally {
      setTogglingFavorite(false)
    }
  }

  // Status de conclusão da aula atual
  const isCurrentLessonCompleted = useMemo(() => {
    if (!currentLesson) return false
    const entry = userProgressList.find((p) => p.lesson === currentLesson.id)
    return Boolean(entry?.completed)
  }, [userProgressList, currentLesson])

  // Estatísticas de progresso no curso
  const courseProgressStats = useMemo(() => {
    const total = courseLessons.length
    if (!total) return { total: 0, completed: 0, percentage: 0 }

    const completedLessonIds = new Set(
      userProgressList.filter((p) => p.completed).map((p) => p.lesson),
    )
    const completedCount = courseLessons.filter((l) => completedLessonIds.has(l.id)).length
    const percentage = Math.round((completedCount / total) * 100)

    return {
      total,
      completed: completedCount,
      percentage,
    }
  }, [courseLessons, userProgressList])

  // Alternar conclusão da aula atual
  const handleToggleComplete = async () => {
    if (!user?.id || !currentLesson) return
    setTogglingProgress(true)
    const nextCompleted = !isCurrentLessonCompleted

    try {
      const updated = await toggleLessonProgress(user.id, currentLesson.id, nextCompleted)
      setUserProgressList((prev) => {
        const withoutCurrent = prev.filter((p) => p.lesson !== currentLesson.id)
        return [...withoutCurrent, updated]
      })

      // Se acabou de completar a última aula restante (100%), emitir certificado automaticamente!
      if (nextCompleted && course && courseLessons.length > 0) {
        const withoutCurrent = userProgressList.filter((p) => p.lesson !== currentLesson.id)
        const allCompleted = courseLessons.every((l) =>
          l.id === currentLesson.id
            ? true
            : withoutCurrent.some((p) => p.lesson === l.id && p.completed),
        )
        if (allCompleted) {
          try {
            const cert = await issueCertificate(user.id, course.id, course.slug)
            setCourseCertificate(cert)
            setCertDialogOpen(true)
            toast({
              title: '🎉 Parabéns! Curso 100% Concluído!',
              description: 'Seu Certificado Oficial foi emitido com sucesso.',
            })
          } catch (certErr) {
            console.error('Erro ao emitir certificado:', certErr)
          }
        }
      }

      toast({
        title: nextCompleted ? 'Aula concluída!' : 'Aula marcada como pendente',
        description: nextCompleted
          ? 'Progresso atualizado com sucesso!'
          : 'Status de conclusão revertido com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar o progresso',
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setTogglingProgress(false)
    }
  }

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

  // Embed YouTube
  const embedUrl = useMemo(
    () => getYouTubeEmbedUrl(currentLesson?.video_url),
    [currentLesson?.video_url],
  )

  // Arquivo de vídeo gravado direto do PocketBase
  const videoUploadUrl = useMemo(() => {
    if (!currentLesson?.video_upload) return null
    return getLessonFileUrl(currentLesson, currentLesson.video_upload)
  }, [currentLesson])

  // Arquivo PDF (upload direto ou link online)
  const pdfDirectUrl = useMemo(() => {
    if (!currentLesson?.pdf_file) return null
    return getLessonFileUrl(currentLesson, currentLesson.pdf_file)
  }, [currentLesson])
  const pdfDownloadUrl = useMemo(() => {
    if (!currentLesson?.pdf_file) return null
    return getLessonFileUrl(currentLesson, currentLesson.pdf_file, { download: true })
  }, [currentLesson])
  const pdfExternalUrl = currentLesson?.pdf_url?.trim() || null

  // Arquivo PPT (upload direto ou link online)
  const pptDirectUrl = useMemo(() => {
    if (!currentLesson?.ppt_file) return null
    return getLessonFileUrl(currentLesson, currentLesson.ppt_file)
  }, [currentLesson])
  const pptDownloadUrl = useMemo(() => {
    if (!currentLesson?.ppt_file) return null
    return getLessonFileUrl(currentLesson, currentLesson.ppt_file, { download: true })
  }, [currentLesson])
  const pptExternalUrl = currentLesson?.ppt_url?.trim() || null

  // Arquivo Excel (upload direto)
  const excelDirectUrl = useMemo(() => {
    if (!currentLesson?.excel_file) return null
    return getLessonFileUrl(currentLesson, currentLesson.excel_file)
  }, [currentLesson])
  const excelDownloadUrl = useMemo(() => {
    if (!currentLesson?.excel_file) return null
    return getLessonFileUrl(currentLesson, currentLesson.excel_file, { download: true })
  }, [currentLesson])

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

  const hasCourseAccess = canAccessCourseContent(currentLesson.course)
  if (!hasCourseAccess) {
    return (
      <div className="mx-auto max-w-[900px] py-12">
        <div className="rounded-3xl border-2 border-dashed border-[#F5B041]/50 bg-[#FFFDF8] p-8 text-center shadow-[0_4px_20px_rgba(31,56,100,.06)] sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF8E7] text-[#D97706] shadow-sm">
            <span className="text-2xl font-bold">🔒</span>
          </div>
          <span className="mt-4 inline-block rounded-full bg-[#FFF8E7] px-4 py-1 text-xs font-bold text-[#B7791F]">
            Conteúdo exclusivo — adquira o curso
          </span>
          <h2 className="mt-3 text-2xl font-bold text-[#1F3864]">Acesso bloqueado a esta aula</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-[#5A6B7E] leading-relaxed">
            Esta aula pertence a um treinamento no qual você ainda não possui matrícula ativa. Para
            acessar vídeos, materiais didáticos e chat de dúvidas, solicite a liberação à
            coordenação.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/cursos')}
              variant="outline"
              className="h-11 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864]"
            >
              Ver cursos disponíveis
            </Button>
            {course && (
              <>
                <Button
                  onClick={() => navigate(`/cursos/${course.id}`)}
                  variant="outline"
                  className="h-11 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864]"
                >
                  Detalhes do curso
                </Button>
                <Button
                  onClick={() => setCheckoutModalOpen(true)}
                  className="h-11 rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
                >
                  Comprar curso
                </Button>
              </>
            )}
          </div>
        </div>
        <CheckoutModal
          course={course}
          open={checkoutModalOpen}
          onOpenChange={setCheckoutModalOpen}
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

  // Verifica se há algum material disponível além do vídeo principal
  const hasExtraMaterials = Boolean(
    pdfDirectUrl || pdfExternalUrl || pptDirectUrl || pptExternalUrl || excelDirectUrl,
  )

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 pb-16 font-quicksand">
      {/* 2. BARRA DE PROGRESSO DO ALUNO NO TOPO DA TELA DA AULA */}
      <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(31,56,100,.06)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0DF] text-[#6E9B1F]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6E9B1F]">
                Progresso do Aluno
              </p>
              <p className="text-sm font-bold text-[#1F3864]">
                {courseProgressStats.completed} de {courseProgressStats.total}{' '}
                {courseProgressStats.total === 1 ? 'aula concluída' : 'aulas concluídas'} ·{' '}
                <span className="text-[#6E9B1F]">{courseProgressStats.percentage}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {courseProgressStats.percentage === 100 && (
              <Button
                onClick={() => setCertDialogOpen(true)}
                className="h-11 rounded-xl bg-[#1F3864] px-4 font-bold text-white shadow-sm hover:bg-[#172E43]"
              >
                <Sparkles className="mr-2 h-4 w-4 text-[#A8D052]" />
                Ver Certificado
              </Button>
            )}

            <Button
              onClick={handleToggleComplete}
              disabled={togglingProgress}
              className={cn(
                'h-11 rounded-xl px-5 font-bold transition shadow-sm',
                isCurrentLessonCompleted
                  ? 'bg-[#EAF0DF] text-[#6E9B1F] hover:bg-[#dfe7d2]'
                  : 'bg-[#6E9B1F] text-white hover:bg-[#5C8619]',
              )}
            >
              {togglingProgress ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isCurrentLessonCompleted ? (
                <Check className="mr-2 h-4 w-4 stroke-[3]" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {isCurrentLessonCompleted ? 'Aula concluída' : 'Marcar como concluída'}
            </Button>
          </div>
        </div>

        {/* Linha da barra de progresso visual */}
        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EDF0EA]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6E9B1F] to-[#88B82B] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, courseProgressStats.percentage))}%` }}
          />
        </div>
      </section>

      {/* CABEÇALHO DO CURSO E NAVEGAÇÃO ENTRE AULAS */}
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

      {/* 1. SEÇÃO DE VÍDEO: YOUTUBE, VÍDEO GRAVADO OU PLACEHOLDER "VÍDEO EM BREVE" */}
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
          ) : videoUploadUrl ? (
            <video
              src={videoUploadUrl}
              controls
              playsInline
              className="absolute inset-0 h-full w-full bg-black object-contain"
            >
              Seu navegador não suporta a tag de vídeo.
            </video>
          ) : (
            /* Placeholder com ícone de play e texto verbatim "Vídeo em breve" */
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
                  Gerenciar materiais da aula
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO DE MATERIAIS COMPLEMENTARES CADASTRADOS (PDF, PPT, VÍDEO GRAVADO ADICIONAL) */}
      {hasExtraMaterials && (
        <section className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(31,56,100,.08)] sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6E9B1F]">
                Materiais Didáticos
              </p>
              <h2 className="text-xl font-bold text-[#1F3864]">
                Arquivos e apresentações desta aula
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Material em Excel / Planilha como fonte externa */}
            {excelDirectUrl && (
              <div className="flex flex-col justify-between rounded-2xl border border-[#EDF0EA] bg-[#FDFDFD] p-5 shadow-sm transition hover:border-[#1E7145]/40 hover:bg-[#F3F9F5]">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1E7145]/10 text-[#1E7145]">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block rounded-md bg-[#1E7145]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1E7145]">
                      Planilha (Excel)
                    </span>
                    <h3 className="mt-1 font-bold text-[#1F3864]">Planilha de Apoio</h3>
                    <p className="mt-0.5 text-xs font-medium text-[#718096]">
                      Fonte externa e tabelas práticas (.xlsx / .csv)
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#EDF0EA] pt-4">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] hover:bg-white"
                  >
                    <a href={excelDirectUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-[#1E7145]" />
                      Abrir
                    </a>
                  </Button>
                  {excelDownloadUrl && (
                    <Button
                      asChild
                      size="sm"
                      className="h-9 rounded-xl bg-[#1E7145] font-bold text-white hover:bg-[#165836]"
                    >
                      <a href={excelDownloadUrl} download>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Baixar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Material em PDF */}
            {(pdfDirectUrl || pdfExternalUrl) && (
              <div className="flex flex-col justify-between rounded-2xl border border-[#EDF0EA] bg-[#FDFDFD] p-5 shadow-sm transition hover:border-[#C0392B]/40 hover:bg-[#FCF7F7]">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C0392B]/10 text-[#C0392B]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block rounded-md bg-[#C0392B]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C0392B]">
                      PDF
                    </span>
                    <h3 className="mt-1 font-bold text-[#1F3864]">Material em PDF</h3>
                    <p className="mt-0.5 text-xs font-medium text-[#718096]">
                      Apostila, exercícios e leitura de apoio
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#EDF0EA] pt-4">
                  {pdfDirectUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] hover:bg-white"
                    >
                      <a href={pdfDirectUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-[#C0392B]" />
                        Abrir PDF
                      </a>
                    </Button>
                  )}
                  {pdfDownloadUrl && (
                    <Button
                      asChild
                      size="sm"
                      className="h-9 rounded-xl bg-[#C0392B] font-bold text-white hover:bg-[#A93226]"
                    >
                      <a href={pdfDownloadUrl} download>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Baixar
                      </a>
                    </Button>
                  )}
                  {!pdfDirectUrl && pdfExternalUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] hover:bg-white"
                    >
                      <a href={pdfExternalUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-[#C0392B]" />
                        Acessar PDF online
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Material em PPT / PowerPoint */}
            {(pptDirectUrl || pptExternalUrl) && (
              <div className="flex flex-col justify-between rounded-2xl border border-[#EDF0EA] bg-[#FDFDFD] p-5 shadow-sm transition hover:border-[#D35400]/40 hover:bg-[#FDF9F5]">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D35400]/10 text-[#D35400]">
                    <Presentation className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block rounded-md bg-[#D35400]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D35400]">
                      Slides
                    </span>
                    <h3 className="mt-1 font-bold text-[#1F3864]">Apresentação (PPT)</h3>
                    <p className="mt-0.5 text-xs font-medium text-[#718096]">
                      Slides apresentados pelo instrutor
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#EDF0EA] pt-4">
                  {pptDirectUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] hover:bg-white"
                    >
                      <a href={pptDirectUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-[#D35400]" />
                        Visualizar slides
                      </a>
                    </Button>
                  )}
                  {pptDownloadUrl && (
                    <Button
                      asChild
                      size="sm"
                      className="h-9 rounded-xl bg-[#D35400] font-bold text-white hover:bg-[#BA4A00]"
                    >
                      <a href={pptDownloadUrl} download>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Baixar PPT
                      </a>
                    </Button>
                  )}
                  {!pptDirectUrl && pptExternalUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] hover:bg-white"
                    >
                      <a href={pptExternalUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-[#D35400]" />
                        Acessar slides online
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* METADADOS, TÍTULO DA AULA E DESCRIÇÃO CURTA */}
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
              {isCurrentLessonCompleted && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#6E9B1F]/15 px-3 py-1 text-xs font-bold text-[#6E9B1F]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  Concluída
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1F3864] sm:text-3xl">
              {currentLesson.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={togglingFavorite}
              className={cn(
                'h-10 rounded-xl border px-3 text-xs font-bold transition shadow-sm',
                isFavorited
                  ? 'border-[#E74C3C]/30 bg-[#FDEDEC] text-[#E74C3C] hover:bg-[#FADBD8]'
                  : 'border-[#D9D9D9] text-[#5A6B7E] hover:bg-[#F4F5F3]',
              )}
              title={isFavorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <Heart
                className={cn('h-4 w-4 mr-1.5', isFavorited && 'fill-[#E74C3C] text-[#E74C3C]')}
              />
              {isFavorited ? 'Favoritada' : 'Favoritar'}
            </Button>

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

      {/* Playlist / Grade rápida das aulas do curso com indicação de concluídas */}
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
              const isCompleted = userProgressList.some((p) => p.lesson === item.id && p.completed)

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
                      isCompleted
                        ? 'bg-[#6E9B1F] text-white'
                        : isSelected
                          ? 'bg-[#1F3864] text-white'
                          : 'bg-[#EDF0EA] text-[#5A6B7E]',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      String(idx + 1).padStart(2, '0')
                    )}
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

      {/* Widget de Chat da Aula */}
      <LessonChatWidget lessonId={currentLesson.id} lessonTitle={currentLesson.title} />

      {/* Modal de Edição de Aula */}
      <LessonFormDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) void refreshLessons()
        }}
        lesson={currentLesson}
        courses={courses}
      />

      {/* Modal de Certificado de Conclusão */}
      <CertificateDialog
        open={certDialogOpen}
        onOpenChange={setCertDialogOpen}
        student={user}
        course={course}
        issuedAt={courseCertificate?.issued_at}
        certificateCode={courseCertificate?.code}
      />
    </div>
  )
}
