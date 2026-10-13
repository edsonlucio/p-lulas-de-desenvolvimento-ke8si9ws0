import { useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, GraduationCap, LibraryBig } from 'lucide-react'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { CourseCard } from '@/components/courses/CourseCard'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useCourseModal } from '@/contexts/CourseModalContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { canManageCoursesAndLessons } from '@/lib/roles'
import type { Course } from '@/types/backoffice'
import { cn } from '@/lib/utils'

type Filter = 'todos' | 'ativo' | 'inativo'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const tick = (time: number) => {
      const progress = Math.min((time - start) / 800, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{display.toLocaleString('pt-BR')}</>
}

const filters: Array<{ value: Filter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { courses, lessons, loading, updateCourseStatus, deleteCourse, lessonCount } =
    useBackoffice()
  const { openNewCourse, openEditCourse } = useCourseModal()
  const { toast } = useToast()
  const [filter, setFilter] = useState<Filter>('todos')
  const [deleting, setDeleting] = useState<Course | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const canManage = canManageCoursesAndLessons(user)

  const filtered = useMemo(
    () => courses.filter((course) => filter === 'todos' || course.status === filter),
    [courses, filter],
  )
  const students = useMemo(
    () => courses.reduce((total, course) => total + course.students_count, 0),
    [courses],
  )
  const firstName = (user?.name || 'Administrador').split(' ')[0]
  const stats = [
    { label: 'Total de Cursos', value: courses.length, icon: LibraryBig, color: 'bg-[#1F3864]' },
    { label: 'Total de Aulas', value: lessons.length, icon: BookOpenCheck, color: 'bg-[#6E9B1F]' },
    { label: 'Total de Alunos', value: students, icon: GraduationCap, color: 'bg-[#44546A]' },
  ]

  const toggleStatus = async (course: Course) => {
    const next = course.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await updateCourseStatus(course, next)
      toast({
        title: next === 'ativo' ? 'Curso ativado' : 'Curso desativado',
        description: `${course.title} foi atualizado com sucesso.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar',
        description: getPortugueseError(error),
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await deleteCourse(deleting)
      toast({
        title: 'Curso excluído',
        description: `${deleting.title} foi removido.`,
      })
      setDeleting(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: getPortugueseError(error),
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-9">
      <section className="animate-fade-in-down">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6E9B1F]">Visão geral</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1F3864] sm:text-[36px]">
          Olá, {firstName}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-2 text-[15px] font-medium text-[#5A6B7E]">
          Sua plataforma de desenvolvimento humano e comportamental.
        </p>
      </section>

      <section aria-label="Estatísticas rápidas" className="grid gap-4 sm:grid-cols-3 lg:gap-5">
        {loading
          ? [0, 1, 2].map((item) => <Skeleton key={item} className="h-[126px] rounded-2xl" />)
          : stats.map(({ label, value, icon: Icon, color }, index) => (
              <div
                key={label}
                style={{ animationDelay: `${index * 80}ms` }}
                className="animate-fade-in-up flex items-center gap-4 rounded-2xl bg-white p-5 opacity-0 shadow-[0_4px_16px_rgba(31,56,100,.07)] transition-all duration-200 [animation-fill-mode:forwards] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(31,56,100,.12)] sm:p-6"
              >
                <span
                  className={cn(
                    'flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:h-14 sm:w-14',
                    color,
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-3xl font-bold leading-none text-[#1F3864]">
                    <AnimatedNumber value={value} />
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#718096]">{label}</p>
                </div>
              </div>
            ))}
      </section>

      <section>
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1F3864]">Meus Cursos</h2>
            <p className="mt-1 text-sm font-medium text-[#718096]">
              Conteúdos cadastrados na sua plataforma
            </p>
          </div>
          <div
            className="relative grid grid-cols-3 rounded-full bg-white p-1 shadow-[0_3px_12px_rgba(31,56,100,.07)]"
            role="tablist"
            aria-label="Filtrar cursos por status"
          >
            <span
              className="absolute bottom-1 top-1 w-[calc((100%-8px)/3)] rounded-full bg-[#1F3864] shadow-sm transition-transform duration-300"
              style={{
                transform: `translateX(${filters.findIndex((item) => item.value === filter) * 100}%)`,
              }}
            />
            {filters.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={cn(
                  'relative z-10 min-h-9 min-w-[82px] rounded-full px-3 text-xs font-bold transition-colors duration-300',
                  filter === item.value ? 'text-white' : 'text-[#5A6B7E] hover:text-[#1F3864]',
                )}
                role="tab"
                aria-selected={filter === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="aspect-[.78] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length ? (
          <div key={filter} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                lessonCount={lessonCount(course.id)}
                index={index}
                onEdit={() => openEditCourse(course)}
                onToggle={() => void toggleStatus(course)}
                onDelete={() => setDeleting(course)}
                canManage={canManage}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum curso encontrado neste filtro"
            description={
              canManage
                ? 'Experimente outro status ou cadastre um novo curso para continuar.'
                : 'Nenhum curso disponível no momento para esta seleção.'
            }
            actionLabel={canManage ? 'Novo Curso' : undefined}
            onAction={canManage ? openNewCourse : undefined}
          />
        )}
      </section>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir curso?"
        description={
          deleting
            ? `“${deleting.title}” e todas as suas aulas serão removidos. Esta ação não pode ser desfeita.`
            : undefined
        }
        onConfirm={() => void confirmDelete()}
        loading={deleteLoading}
      />
    </div>
  )
}
