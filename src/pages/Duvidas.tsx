import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, HelpCircle, LockKeyhole, MessageSquareQuote, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageIntro } from '@/components/PageIntro'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { getUserRole } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { listStudentQuestions, type QuestionMessage } from '@/services/questions'

interface CourseQuestions {
  courseId: string
  courseTitle: string
  count: number
  questions: Array<{
    id: string
    message: string
    created: string
    author: string
    lessonId: string
    lessonTitle: string
  }>
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Duvidas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const role = getUserRole(user)
  const allowed = role === 'adm' || role === 'coordenador'

  const [questions, setQuestions] = useState<QuestionMessage[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!allowed) return
    setLoading(true)
    try {
      setQuestions(await listStudentQuestions())
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar as dúvidas',
        description: getPortugueseError(error),
      })
    } finally {
      setLoading(false)
    }
  }, [allowed, toast])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo<CourseQuestions[]>(() => {
    const byCourse = new Map<string, CourseQuestions>()
    for (const message of questions) {
      const lesson = message.expand?.lesson
      const course = message.expand?.['lesson.course']
      const courseId = course?.id || lesson?.course || 'sem-curso'
      const courseTitle = course?.title || 'Curso removido'
      let entry = byCourse.get(courseId)
      if (!entry) {
        entry = { courseId, courseTitle, count: 0, questions: [] }
        byCourse.set(courseId, entry)
      }
      entry.count += 1
      entry.questions.push({
        id: message.id,
        message: message.message,
        created: message.created,
        author: message.expand?.user?.name || message.expand?.user?.email || 'Aluno',
        lessonId: message.lesson,
        lessonTitle: lesson?.title || 'Aula removida',
      })
    }
    return [...byCourse.values()].sort((a, b) => b.count - a.count)
  }, [questions])

  if (!allowed) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD3C3] bg-white/70 px-6 py-12 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#EAF0DF] text-[#1F3864]">
            <LockKeyhole className="h-9 w-9" />
          </div>
          <h3 className="text-lg font-bold text-[#1F3864]">Acesso restrito</h3>
          <p className="mt-1 max-w-md text-sm font-medium text-[#5A6B7E]">
            Este painel está disponível apenas para Adm e Coordenador.
          </p>
        </div>
      </div>
    )
  }

  const total = questions.length
  const maxCount = grouped.length ? grouped[0].count : 0

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      <PageIntro
        eyebrow="Comunidade"
        title="Dúvidas Frequentes"
        description="Perguntas enviadas pelos alunos no chat das aulas, agrupadas por curso."
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : grouped.length ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#1F3864] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              {total} {total === 1 ? 'dúvida' : 'dúvidas'} no total
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF0DF] px-3.5 py-1.5 text-xs font-bold text-[#527915]">
              <Users className="h-3.5 w-3.5" />
              {grouped.length} {grouped.length === 1 ? 'curso com dúvidas' : 'cursos com dúvidas'}
            </span>
          </div>

          <div className="space-y-5">
            {grouped.map((course, index) => {
              const isTop = course.count === maxCount && maxCount > 0
              return (
                <div
                  key={course.courseId}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className={cn(
                    'animate-fade-in-up overflow-hidden rounded-2xl bg-white opacity-0 shadow-[0_4px_18px_rgba(31,56,100,.07)] [animation-fill-mode:forwards]',
                    isTop && 'ring-2 ring-[#6E9B1F]/60',
                  )}
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-[#EDF0EA] bg-[#F8F9F7] px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm',
                          isTop ? 'bg-[#6E9B1F]' : 'bg-[#1F3864]',
                        )}
                      >
                        <HelpCircle className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-[#1F3864]">{course.courseTitle}</h2>
                        <p className="text-xs font-medium text-[#718096]">
                          {course.count} {course.count === 1 ? 'dúvida' : 'dúvidas'} de alunos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-40 max-w-full overflow-hidden rounded-full bg-[#E4E6E3]">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            isTop ? 'bg-[#6E9B1F]' : 'bg-[#1F3864]',
                          )}
                          style={{ width: `${maxCount ? (course.count / maxCount) * 100 : 0}%` }}
                        />
                      </div>
                      {isTop ? (
                        <span className="rounded-full bg-[#6E9B1F] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                          Mais dúvidas
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ul className="divide-y divide-[#EDF0EA]">
                    {course.questions.map((question) => (
                      <li
                        key={question.id}
                        className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-relaxed text-[#1F3864]">
                            “{question.message}”
                          </p>
                          <p className="mt-1 text-xs font-medium text-[#718096]">
                            {question.author} · {formatDate(question.created)}
                          </p>
                        </div>
                        <Link
                          to={`/aulas/${question.lessonId}`}
                          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-[#F4F5F3] px-3 py-1.5 text-xs font-bold text-[#1F3864] transition hover:bg-[#EAF0DF] hover:text-[#527915]"
                        >
                          {question.lessonTitle}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD3C3] bg-white/70 px-6 py-12 text-center">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#EAF0DF] text-[#6E9B1F]">
            <div className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-[#1F3864]/10" />
            <HelpCircle className="h-9 w-9" />
          </div>
          <h3 className="text-lg font-bold text-[#1F3864]">Nenhuma dúvida registrada ainda</h3>
          <p className="mt-1 max-w-md text-sm font-medium text-[#5A6B7E]">
            Assim que os alunos enviarem perguntas no chat das aulas, elas aparecerão aqui agrupadas
            por curso.
          </p>
        </div>
      )}
    </div>
  )
}
