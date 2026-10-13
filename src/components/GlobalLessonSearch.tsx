import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, PlayCircle, BookOpen, X, Sparkles } from 'lucide-react'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function GlobalLessonSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { lessons, courses, canAccessCourseContent } = useBackoffice()

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar apenas aulas de cursos que o usuário tem permissão de acesso
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    // Mapear cursos acessíveis pelo usuário
    const courseMap = new Map(courses.map((c) => [c.id, c]))

    const matchedLessons = lessons.filter((lesson) => {
      // Regra obrigatória: Restringir resultados a cursos que o usuário está matriculado / tem acesso
      if (!canAccessCourseContent(lesson.course)) return false

      const courseTitle = courseMap.get(lesson.course)?.title?.toLowerCase() || ''
      const lessonTitle = lesson.title.toLowerCase()
      const lessonDesc = (lesson.description || '').toLowerCase()

      return lessonTitle.includes(q) || lessonDesc.includes(q) || courseTitle.includes(q)
    })

    // Agrupar por curso
    const grouped = new Map<string, { courseName: string; lessons: typeof matchedLessons }>()
    for (const l of matchedLessons) {
      const course = courseMap.get(l.course)
      const courseId = l.course
      const courseName = course?.title || 'Curso'
      if (!grouped.has(courseId)) {
        grouped.set(courseId, { courseName, lessons: [] })
      }
      grouped.get(courseId)!.lessons.push(l)
    }

    return Array.from(grouped.entries()).map(([courseId, data]) => ({
      courseId,
      courseName: data.courseName,
      lessons: data.lessons.slice(0, 5), // até 5 por curso no dropdown rápido
    }))
  }, [query, lessons, courses, canAccessCourseContent])

  const totalResultsCount = searchResults.reduce((acc, g) => acc + g.lessons.length, 0)

  const handleSelectLesson = (lessonId: string) => {
    setIsOpen(false)
    setQuery('')
    navigate(`/aulas/${lessonId}`)
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-[220px] sm:max-w-xs md:max-w-sm">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar nas suas aulas..."
          className="h-10 w-full rounded-xl border-[#1F3864]/15 bg-[#F4F5F3] pl-9 pr-8 text-xs font-medium placeholder:text-[#718096] focus-visible:ring-[#6E9B1F] dark:bg-[#1A334C] dark:border-white/10 dark:text-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#718096] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-96 overflow-y-auto rounded-2xl border border-[#EDF0EA] bg-white p-2 shadow-xl dark:bg-[#1A334C] dark:border-white/10">
          <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#718096] dark:text-white/50 flex items-center justify-between">
            <span>Resultados de aulas</span>
            <span className="text-[#6E9B1F] font-bold">{totalResultsCount} encontradas</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs font-semibold text-[#1F3864] dark:text-white">
                Nenhuma aula acessível encontrada
              </p>
              <p className="mt-1 text-[11px] text-[#718096] dark:text-white/60">
                Apenas conteúdos de treinamentos matriculados são exibidos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((group) => (
                <div key={group.courseId} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 pt-1 text-xs font-bold text-[#6E9B1F]">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="truncate">{group.courseName}</span>
                  </div>
                  {group.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson.id)}
                      className="w-full flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-[#F4F5F3] dark:hover:bg-white/5"
                    >
                      <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#1F3864] dark:text-white" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#1F3864] dark:text-white">
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="line-clamp-1 text-[11px] font-medium text-[#718096] dark:text-white/60">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-[#718096] dark:text-white/50">
                        {lesson.duration_min} min
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
