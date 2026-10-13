import { useMemo, useState } from 'react'
import { BookOpen, Lock, Search, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { CourseActions } from '@/components/courses/CourseActions'
import { EmptyState } from '@/components/EmptyState'
import { PageIntro } from '@/components/PageIntro'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useCourseModal } from '@/contexts/CourseModalContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { canManageCoursesAndLessons } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { CheckoutModal } from '@/components/courses/CheckoutModal'
import { getCourseCoverUrl } from '@/services/courses'
import type { Course } from '@/types/backoffice'

export default function Courses() {
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<Course | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { user } = useAuth()
  const {
    courses,
    loading,
    lessonCount,
    updateCourseStatus,
    deleteCourse,
    canAccessCourseContent,
    pendingEnrollments,
  } = useBackoffice()
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null)
  const { openNewCourse, openEditCourse } = useCourseModal()
  const { toast } = useToast()
  const navigate = useNavigate()
  const canManage = canManageCoursesAndLessons(user)

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return courses.filter(
      (course) =>
        !term ||
        course.title.toLocaleLowerCase('pt-BR').includes(term) ||
        course.description.toLocaleLowerCase('pt-BR').includes(term),
    )
  }, [courses, search])

  const toggle = async (course: Course) => {
    const next = course.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await updateCourseStatus(course, next)
      toast({
        title: next === 'ativo' ? 'Curso ativado' : 'Curso desativado',
        description: `${course.title} foi atualizado.`,
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
      toast({ title: 'Curso excluído', description: 'O curso e suas aulas foram removidos.' })
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
    <div className="mx-auto max-w-[1600px] space-y-7">
      <PageIntro
        eyebrow="Conteúdo"
        title="Cursos"
        description="Gerencie os treinamentos, status e informações disponíveis na plataforma."
      />
      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#718096]" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por título ou descrição..."
          className="h-12 rounded-xl border-0 bg-white pl-12 font-medium shadow-[0_3px_14px_rgba(31,56,100,.06)] focus-visible:ring-[#6E9B1F]"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(31,56,100,.07)]">
          <div className="hidden grid-cols-[minmax(330px,1.8fr)_110px_100px_120px_50px] items-center gap-4 border-b border-[#EDF0EA] bg-[#F8F9F7] px-5 py-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#718096] md:grid">
            <span>Curso</span>
            <span>Aulas</span>
            <span>Alunos</span>
            <span>Status</span>
            <span />
          </div>
          <div className="divide-y divide-[#EDF0EA]">
            {filtered.map((course, index) => {
              const cover = getCourseCoverUrl(course)
              const count = lessonCount(course.id)
              const hasAccess = canAccessCourseContent(course.id)
              return (
                <div
                  key={course.id}
                  style={{ animationDelay: `${index * 55}ms` }}
                  onClick={() => navigate(`/cursos/${course.id}`)}
                  className="animate-fade-in-up cursor-pointer px-4 py-4 opacity-0 transition [animation-fill-mode:forwards] hover:bg-[#F9FAF8] md:grid md:grid-cols-[minmax(330px,1.8fr)_110px_100px_120px_50px] md:items-center md:gap-4 md:px-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#1F3864] to-[#1E3A12]">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className={`h-full w-full object-cover ${!hasAccess ? 'brightness-50 grayscale-[30%]' : ''}`}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-bold text-white">
                          P.
                        </div>
                      )}
                      {!hasAccess && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Lock className="h-5 w-5 text-[#F5B041]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-[#1F3864]">{course.title}</h3>
                        {!hasAccess && (
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                              pendingEnrollments.includes(course.id)
                                ? 'bg-[#FFF8E7] text-[#D97706] border-[#F5B041]/50'
                                : 'bg-[#FFF8E7] text-[#B7791F] border-[#F5B041]/40',
                            )}
                          >
                            {pendingEnrollments.includes(course.id)
                              ? 'Aguardando aprovação'
                              : 'Bloqueado'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs font-medium text-[#718096]">
                        {course.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 md:mt-0 md:contents">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B7E]">
                      <BookOpen className="h-4 w-4 text-[#6E9B1F]" />
                      {count}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A6B7E]">
                      <UsersRound className="h-4 w-4 text-[#44546A]" />
                      {course.students_count}
                    </span>
                    <StatusBadge status={course.status} />
                    {canManage ? (
                      <CourseActions
                        course={course}
                        onEdit={() => openEditCourse(course)}
                        onToggle={() => void toggle(course)}
                        onDelete={() => setDeleting(course)}
                      />
                    ) : !hasAccess ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        {pendingEnrollments.includes(course.id) ? (
                          <span className="rounded-xl bg-[#FFF8E7] px-2.5 py-1 text-[11px] font-bold text-[#D97706] border border-[#F5B041]/30">
                            Em análise
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setCheckoutCourse(course)}
                            className="h-8 rounded-xl bg-[#6E9B1F] px-3 text-xs font-bold text-white hover:bg-[#5C8619]"
                          >
                            Comprar
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="w-9" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          title={search ? 'Nenhum curso corresponde à busca' : 'Nenhum curso cadastrado'}
          description={
            search
              ? 'Tente buscar por outro termo.'
              : canManage
                ? 'Cadastre seu primeiro curso para começar.'
                : 'Nenhum curso disponível no momento.'
          }
          actionLabel={canManage ? 'Novo Curso' : undefined}
          onAction={canManage ? openNewCourse : undefined}
        />
      )}

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

      <CheckoutModal
        course={checkoutCourse}
        open={Boolean(checkoutCourse)}
        onOpenChange={(open) => !open && setCheckoutCourse(null)}
      />
    </div>
  )
}
