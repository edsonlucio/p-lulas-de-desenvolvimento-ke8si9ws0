import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Clock3, Heart, Loader2, PlayCircle, Sparkles, Trash2 } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useToast } from '@/hooks/use-toast'
import { listUserFavorites, toggleFavoriteLesson } from '@/services/favorites'
import { getLessonFileUrl } from '@/services/lessons'
import { getUserCourseProgress } from '@/services/progress'
import type { Lesson, LessonFavorite, LessonProgress } from '@/types/backoffice'

export default function Favoritas() {
  const { user } = useAuth()
  const { courses, lessons, loading: boLoading } = useBackoffice()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [favorites, setFavorites] = useState<LessonFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<LessonProgress[]>([])
  const [unfavoritingId, setUnfavoritingId] = useState<string | null>(null)

  const loadData = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [favs, prog] = await Promise.all([
        listUserFavorites(user.id),
        getUserCourseProgress(user.id),
      ])
      setFavorites(favs)
      setUserProgress(prog)
    } catch (err) {
      console.warn('Erro ao carregar favoritos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [user?.id])

  const handleUnfavorite = async (lessonId: string, lessonTitle: string) => {
    if (!user?.id) return
    setUnfavoritingId(lessonId)
    try {
      await toggleFavoriteLesson(user.id, lessonId)
      setFavorites((prev) => prev.filter((f) => f.lesson !== lessonId))
      toast({
        title: 'Removida dos favoritos',
        description: `“${lessonTitle}” foi retirada da sua lista de favoritas.`,
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover favorito',
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setUnfavoritingId(null)
    }
  }

  // Montar lista de aulas favoritadas completas
  const favoritedLessonsWithData = useMemo(() => {
    return favorites
      .map((fav) => {
        // Objeto da aula pode vir do expand ou do backoffice context
        const lesson = fav.expand?.lesson || lessons.find((l) => l.id === fav.lesson) || null
        if (!lesson) return null

        const course =
          fav.expand?.lesson?.expand?.course || courses.find((c) => c.id === lesson.course) || null

        const isCompleted = userProgress.some((p) => p.lesson === lesson.id && p.completed)
        return {
          favoriteId: fav.id,
          lesson,
          course,
          isCompleted,
        }
      })
      .filter(
        (item): item is { favoriteId: string; lesson: Lesson; course: any; isCompleted: boolean } =>
          item !== null,
      )
  }, [favorites, lessons, courses, userProgress])

  return (
    <div className="mx-auto max-w-[1300px] space-y-7 font-quicksand">
      <PageIntro
        eyebrow="Seus conteúdos prediletos"
        title="Aulas Favoritas"
        description="Acesse rapidamente as aulas que você marcou com o coração para rever quando quiser."
      />

      {loading || boLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-white p-4 shadow-sm dark:bg-[#1A334C]">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : favoritedLessonsWithData.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#CBD3C3] bg-white p-12 text-center shadow-sm dark:bg-[#1A334C] dark:border-white/10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FDEDEC] text-[#E74C3C] shadow-sm">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#1F3864] dark:text-white">
            Nenhuma aula favoritada ainda
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#718096] dark:text-white/60">
            Enquanto assiste a uma aula, clique no botão “Favoritar” para adicioná-la a esta coleção
            rápida.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => navigate('/aulas')}
              className="h-11 rounded-xl bg-[#6E9B1F] px-6 font-bold text-white hover:bg-[#5C8619]"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Explorar aulas
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favoritedLessonsWithData.map(({ favoriteId, lesson, course, isCompleted }) => {
            const thumbnail = lesson.thumbnail ? getLessonFileUrl(lesson, lesson.thumbnail) : null

            return (
              <div
                key={favoriteId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-[#EDF0EA] p-5 shadow-[0_4px_18px_rgba(31,56,100,.06)] transition hover:-translate-y-1 hover:shadow-lg dark:bg-[#1A334C] dark:border-white/10"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1F3864] to-[#334F68]">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white">
                        <PlayCircle className="h-12 w-12 opacity-50" />
                      </div>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                      {lesson.duration_min} min
                    </span>

                    {isCompleted && (
                      <span className="absolute top-2.5 left-2.5 rounded-lg bg-[#6E9B1F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Concluída
                      </span>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="mt-4">
                    {course && (
                      <p className="truncate text-xs font-bold text-[#6E9B1F]">{course.title}</p>
                    )}
                    <h3 className="mt-1 line-clamp-2 text-base font-bold text-[#1F3864] group-hover:text-[#6E9B1F] transition dark:text-white">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs font-medium text-[#718096] dark:text-white/60">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#EDF0EA] pt-4 dark:border-white/10">
                  <Button
                    onClick={() => navigate(`/aulas/${lesson.id}`)}
                    className="h-9 rounded-xl bg-[#1F3864] px-4 text-xs font-bold text-white hover:bg-[#172E43]"
                  >
                    <PlayCircle className="mr-1.5 h-3.5 w-3.5 text-[#A8D052]" />
                    Assistir
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={unfavoritingId === lesson.id}
                    onClick={() => void handleUnfavorite(lesson.id, lesson.title)}
                    className="h-9 rounded-xl px-2.5 text-xs font-bold text-[#E74C3C] hover:bg-[#FDEDEC] dark:hover:bg-[#E74C3C]/20"
                    title="Remover dos favoritos"
                  >
                    {unfavoritingId === lesson.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Heart className="mr-1 h-3.5 w-3.5 fill-[#E74C3C]" />
                        Desfavoritar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
